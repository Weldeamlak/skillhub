import Course from "../model/Course.js";
import Lesson from "../model/Lesson.js";
import User from "../model/User.js";
import { logInfo, logError } from "../logs/logger.js";
import { redisClient } from "../config/redis.js";
import { uploadToCloud } from "./storageService.js";

// ✅ Fix #13 (SRP): All lesson functions removed from here — they live in lessonService.js.
// courseService.js is now exclusively about Course CRUD.

const CACHE_TTL = 900; // 15 minutes

/**
 * Utility to clear all course-related caches
 */
const clearCourseCache = async () => {
  try {
    if (redisClient && redisClient.isOpen) {
      const keys = await redisClient.keys('courses:*');
      if (keys.length > 0) {
        await redisClient.del(keys);
        logInfo(`Cleared ${keys.length} course cache keys`);
      }
    }
  } catch (err) {
    logError(`Cache clearing failed: ${err.message}`);
  }
};

// ✅ Create a new course
export const createCourseService = async (courseData, user) => {
  try {
    if (!courseData) throw new Error("Course data is required");

    const { title, description, price, category, instructor: instructorId } = courseData;

    if (!title || !description || price === undefined || !category) {
      throw new Error(
        "Missing required course fields: title, description, price, category"
      );
    }

    // Default to the current user (Instructor creating their own course)
    let assignedInstructor = user && user._id;

    // ✅ If an admin provides a different instructor ID, use it instead
    if (user.role === 'admin' && instructorId) {
       // Optional: Verification check that the instructor exists and has the correct role
       const instructorUser = await User.findById(instructorId);
       if (!instructorUser) {
          throw new Error("Assigned instructor not found in the database.");
       }
       if (instructorUser.role !== 'instructor') {
          throw new Error("Specified user must have the 'instructor' role to be assigned as course author.");
       }
       assignedInstructor = instructorId;
    }

    const newCourse = new Course({
      title,
      description,
      price,
      category,
      instructor: assignedInstructor,
    });

    const savedCourse = await newCourse.save();
    
    await clearCourseCache(); // Invalidate list caches
    
    logInfo(`Course created with ID: ${savedCourse._id}`);
    return savedCourse;
  } catch (error) {
    logError(`Error creating course: ${error.message}`);
    throw error;
  }
};

// ✅ Get all courses — filter out soft-deleted (fix #19) with Redis Caching
export const getCoursesService = async ({
  filter = {},
  options = null,
} = {}) => {
  try {
    // ✅ Fix #19: Always exclude soft-deleted courses from listings
    const baseFilter = { isDeleted: false, ...filter };

    // Redis Caching Logic
    const cacheKey = `courses:${JSON.stringify(baseFilter)}:${JSON.stringify(options)}`;
    try {
      if (redisClient && redisClient.isOpen) {
        const cached = await redisClient.get(cacheKey);
        if (cached) return JSON.parse(cached);
      }
    } catch (err) {
      logError(`Cache read failed: ${err.message}`);
    }

    const query = Course.find(baseFilter)
      .populate("instructor", "username email role")
      .populate("lessons");

    let result;
    if (!options) {
      result = await query.exec();
    } else {
      const total = await Course.countDocuments(baseFilter);
      const docs = await query
        .sort(options.sort)
        .skip(options.skip)
        .limit(options.limit)
        .select(options.select)
        .exec();

      result = {
        total,
        page: options.page,
        limit: options.limit,
        totalPages: Math.ceil(total / (options.limit || 1)),
        data: docs,
      };
    }

    // Save to Cache
    try {
      if (redisClient && redisClient.isOpen) {
        await redisClient.set(cacheKey, JSON.stringify(result), { EX: CACHE_TTL });
      }
    } catch (err) {
      logError(`Cache write failed: ${err.message}`);
    }

    return result;
  } catch (error) {
    logError(`Error fetching courses: ${error.message}`);
    throw error;
  }
};

// ✅ Get course by id — also block soft-deleted (fix #19)
export const getCourseByIdService = async (id) => {
  try {
    const course = await Course.findOne({ _id: id, isDeleted: false })
      .populate("instructor", "username email role")
      .populate("lessons");
    if (!course) throw new Error("Course not found");
    return course;
  } catch (error) {
    logError(`Error fetching course by id: ${error.message}`);
    throw error;
  }
};

// ✅ Update course
export const updateCourseService = async (id, updateData, user) => {
  try {
    const course = await Course.findOne({ _id: id, isDeleted: false });
    if (!course) throw new Error("Course not found");

    // Only instructor (creator) or admin can update
    if (
      course.instructor.toString() !== user._id.toString() &&
      user.role !== "admin"
    ) {
      throw new Error("Not authorized to update this course");
    }

    Object.assign(course, updateData);
    const updatedCourse = await course.save();

    await clearCourseCache(); // Invalidate caches

    logInfo(`Course updated: ${updatedCourse.title}`);
    return updatedCourse;
  } catch (error) {
    logError(`Error updating course: ${error.message}`);
    throw error;
  }
};

// ✅ Fix #19: Soft-delete course instead of hard-deleting
// Hard delete orphaned Payment and Enrollment records; soft-delete preserves data integrity.
export const deleteCourseService = async (id) => {
  try {
    const course = await Course.findOne({ _id: id, isDeleted: false });
    if (!course) throw new Error("Course not found");

    // Soft-delete: mark isDeleted = true, also archive status
    course.isDeleted = true;
    course.status = "archived";
    await course.save();

    await clearCourseCache(); // Invalidate caches

    logInfo(`Course soft-deleted: ${course.title}`);
    return { message: "Course deleted successfully", id };
  } catch (error) {
    logError(`Error deleting course: ${error.message}`);
    throw error;
  }
};

// ✅ Upload course thumbnail
export const uploadCourseThumbnailService = async (id, file, user) => {
  try {
    const course = await Course.findOne({ _id: id, isDeleted: false });
    if (!course) throw new Error("Course not found");

    if (course.instructor.toString() !== user._id.toString() && user.role !== "admin") {
      throw new Error("Not authorized to update this course thumbnail");
    }

    if (!file) {
      throw new Error("No file provided");
    }

    // Upload to Cloudinary using service
    const result = await uploadToCloud(file.buffer, "skillhub/courses/thumbnails", "image");
    
    course.thumbnail = result.secure_url;
    await course.save();
    
    await clearCourseCache();

    logInfo(`Course thumbnail uploaded for: ${course.title}`);
    return course;
  } catch (error) {
    logError(`Error uploading course thumbnail: ${error.message}`);
    throw error;
  }
};
