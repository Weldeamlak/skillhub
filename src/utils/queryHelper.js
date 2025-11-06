// src/utils/queryHelper.js
// Small helper to parse query params into Mongoose filter and options
export function parseSort(sortStr) {
  if (!sortStr) return undefined;
  // Accept comma separated like "createdAt,-price" and return same string for mongoose
  return sortStr
    .split(",")
    .map((s) => s.trim())
    .join(" ");
}

export function buildQueryOptions(query = {}, allowedFilters = []) {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(parseInt(query.limit, 10) || 10, 100);
  const skip = (page - 1) * limit;
  const sort = parseSort(query.sort);
  const select = query.fields
    ? query.fields
        .split(",")
        .map((f) => f.trim())
        .join(" ")
    : undefined;

  const filter = {};
  for (const key of Object.keys(query)) {
    if (["page", "limit", "sort", "fields", "q"].includes(key)) continue;

    const opMatch = key.match(/^(.+)\[(gte|lte|gt|lt|in|ne)\]$/);
    if (opMatch) {
      const field = opMatch[1];
      const op = opMatch[2];
      if (allowedFilters.length === 0 || allowedFilters.includes(field)) {
        if (!filter[field]) filter[field] = {};
        if (op === "in") filter[field]["$in"] = String(query[key]).split(",");
        else
          filter[field]["$" + op] = isNaN(query[key])
            ? query[key]
            : Number(query[key]);
      }
    } else {
      if (allowedFilters.length === 0 || allowedFilters.includes(key)) {
        filter[key] = query[key];
      }
    }
  }

  // simple full text search if q provided (requires text index in model)
  if (query.q) {
    filter.$text = { $search: query.q };
  }

  return { filter, options: { page, limit, skip, sort, select } };
}
