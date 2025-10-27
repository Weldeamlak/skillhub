import { RateLimiterRedis, RateLimiterMemory } from "rate-limiter-flexible";
import redisClient from "../config/redis.js";
import jwt from "jsonwebtoken";

// small contract:
// - inputs: Express req
// - outputs: either next() or 429 response with Retry-After header

// Read defaults from env
const DEFAULT_POINTS = Number(process.env.RATE_LIMIT_POINTS) || 100;
const DEFAULT_DURATION = Number(process.env.RATE_LIMIT_DURATION) || 60; // seconds

// Comma-separated list of path prefixes to exempt entirely (no rate limiting)
const EXEMPT_PATHS = (process.env.RATE_LIMIT_EXEMPT || "")
  .split(",")
  .map((p) => p.trim())
  .filter(Boolean);

// Per-route custom limits (env format): multiple entries separated by `;` where each is path:points/duration
// Example: /api/auth/login:10/60;/api/auth/register:5/60
const rawCustom = process.env.RATE_LIMIT_ROUTES || "";
const customRouteDefs = rawCustom
  .split(";")
  .map((s) => s.trim())
  .filter(Boolean);

const customRoutes = new Map();
for (const def of customRouteDefs) {
  const [path, spec] = def.split(":");
  if (!path || !spec) continue;
  const [p, d] = spec.split("/");
  const points = Number(p) || DEFAULT_POINTS;
  const duration = Number(d) || DEFAULT_DURATION;
  customRoutes.set(path.trim(), { points, duration });
}

// Role-based quotas (env): semicolon separated role:points/duration or role:unlimited
// Example: free:50/60;pro:1000/60;admin:unlimited
const rawRoleQuotas = process.env.RATE_LIMIT_ROLE_QUOTAS || "";
const roleQuotaDefs = rawRoleQuotas
  .split(";")
  .map((s) => s.trim())
  .filter(Boolean);
const roleQuotas = new Map();
for (const def of roleQuotaDefs) {
  const [role, spec] = def.split(":");
  if (!role || !spec) continue;
  if (spec.trim().toLowerCase() === "unlimited") {
    roleQuotas.set(role.trim(), { unlimited: true });
    continue;
  }
  const [p, d] = spec.split("/");
  const points = Number(p) || DEFAULT_POINTS;
  const duration = Number(d) || DEFAULT_DURATION;
  roleQuotas.set(role.trim(), { points, duration });
}

const makeLimiter = ({ points, duration, keyPrefix } = {}) => {
  const opts = { points, duration };
  try {
    if (redisClient && redisClient.isOpen) {
      return new RateLimiterRedis({
        ...opts,
        storeClient: redisClient,
        keyPrefix: keyPrefix || "rlflx",
      });
    }
  } catch (err) {
    // fall through to memory
    console.warn(
      "Rate limiter: redis unavailable, using memory",
      err && err.message ? err.message : err
    );
  }
  return new RateLimiterMemory({ ...opts });
};

// Default global limiter
let defaultLimiter = makeLimiter({
  points: DEFAULT_POINTS,
  duration: DEFAULT_DURATION,
});

// Cache limiters for custom routes
const limiterCache = new Map();

function findCustomForPath(reqPath) {
  // prefer longest matching prefix
  let match = null;
  for (const [prefix, spec] of customRoutes.entries()) {
    if (
      reqPath === prefix ||
      reqPath.startsWith(prefix + "/") ||
      reqPath.startsWith(prefix)
    ) {
      if (!match || prefix.length > match.prefix.length) {
        match = { prefix, spec };
      }
    }
  }
  return match;
}

export default function rateLimitMiddleware(req, res, next) {
  const reqPath = req.path || req.url || "/";

  // Exempt paths
  for (const ex of EXEMPT_PATHS) {
    if (
      reqPath === ex ||
      reqPath.startsWith(ex + "/") ||
      reqPath.startsWith(ex)
    ) {
      return next();
    }
  }

  // Check custom per-route limit
  const custom = findCustomForPath(reqPath);
  let limiter = defaultLimiter;
  if (custom) {
    const cacheKey = `route:${custom.prefix}`;
    if (limiterCache.has(cacheKey)) {
      limiter = limiterCache.get(cacheKey);
    } else {
      limiter = makeLimiter({
        points: custom.spec.points,
        duration: custom.spec.duration,
        keyPrefix: `rl:${custom.prefix.replace(/\W+/g, "")}`,
      });
      limiterCache.set(cacheKey, limiter);
    }
  }

  // If role-based quota exists and applies, override limiter or skip limiting
  const roleSpec = roleQuotas.get(role);
  if (roleSpec) {
    if (roleSpec.unlimited) {
      // no limiting for this role
      res.set("X-RateLimit-Limit", "unlimited");
      res.set("X-RateLimit-Remaining", "unlimited");
      return next();
    }

    // role-specific limiter (cache by role and route)
    const roleCacheKey = custom
      ? `role:${role}:route:${custom.prefix}`
      : `role:${role}:global`;
    if (limiterCache.has(roleCacheKey)) {
      limiter = limiterCache.get(roleCacheKey);
    } else {
      limiter = makeLimiter({
        points: roleSpec.points,
        duration: roleSpec.duration,
        keyPrefix: `rl:${role}`,
      });
      limiterCache.set(roleCacheKey, limiter);
    }
  }

  // derive key from user id or IP below
  // Prefer authenticated user id when present to have per-user limits
  const getUserIdFromReq = () => {
    if (req.user && (req.user.id || req.user._id))
      return String(req.user.id || req.user._id);
    const authHeader =
      req.headers && (req.headers.authorization || req.headers.Authorization);
    if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
    const token = authHeader.split(" ")[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      return decoded && (decoded.id || decoded._id)
        ? String(decoded.id || decoded._id)
        : null;
    } catch (err) {
      // invalid token or missing secret; ignore and fallback to IP
      return null;
    }
  };

  const userId = getUserIdFromReq();
  const ip =
    req.ip ||
    req.headers["x-forwarded-for"] ||
    (req.connection && req.connection.remoteAddress) ||
    "global";

  // determine whether to use user key based on strategy
  let useUserKey = false;
  if (USER_KEY_STRATEGY === "always") useUserKey = true;
  else if (USER_KEY_STRATEGY === "never") useUserKey = false;
  /* auth-only */ else useUserKey = Boolean(userId);

  // determine role/tier
  const role =
    (req.user && req.user.role) ||
    (userId
      ? (() => {
          try {
            const authHeader =
              req.headers &&
              (req.headers.authorization || req.headers.Authorization);
            if (authHeader && authHeader.startsWith("Bearer ")) {
              const token = authHeader.split(" ")[1];
              const decoded = jwt.decode(token) || {};
              return decoded.role || decoded.tier || "user";
            }
          } catch (e) {
            return "user";
          }
          return "user";
        })()
      : "ip");

  const key = useUserKey && userId ? `user:${userId}:${role}` : `ip:${ip}`;

  limiter
    .consume(key)
    .then((rlRes) => {
      // set rate limit headers
      const limit =
        (custom && custom.spec && custom.spec.points) || DEFAULT_POINTS;
      const remaining =
        rlRes &&
        (rlRes.remainingPoints != null
          ? rlRes.remainingPoints
          : rlRes.remainingPoints);
      const resetEpoch =
        rlRes && rlRes.msBeforeNext
          ? Math.floor((Date.now() + rlRes.msBeforeNext) / 1000)
          : null;
      res.set("X-RateLimit-Limit", String(limit));
      res.set("X-RateLimit-Remaining", String(Math.max(0, remaining || 0)));
      if (resetEpoch) res.set("X-RateLimit-Reset", String(resetEpoch));
      return next();
    })
    .catch((rejRes) => {
      const retrySecs = Math.ceil((rejRes && rejRes.msBeforeNext) / 1000) || 1;
      const limit =
        (custom && custom.spec && custom.spec.points) || DEFAULT_POINTS;
      const resetEpoch =
        rejRes && rejRes.msBeforeNext
          ? Math.floor((Date.now() + rejRes.msBeforeNext) / 1000)
          : null;
      res.set("Retry-After", String(retrySecs));
      res.set("X-RateLimit-Limit", String(limit));
      res.set("X-RateLimit-Remaining", "0");
      if (resetEpoch) res.set("X-RateLimit-Reset", String(resetEpoch));
      res
        .status(429)
        .json({ message: "Too many requests, please try again later." });
    });
}
