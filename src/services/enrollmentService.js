import Enrollment from "../model/Enrollment.js";
import Course from "../model/Course.js";
import { logInfo, logError } from "../logs/logger.js";
import { initializeCourseProgress } from "./progressService.js";
import { addEmailJob } from "../config/queue.js";

export const createEnrollmentService = async (enrollmentData, user) => {
  try {
    const { course } = enrollmentData;

    const existingCourse = await Course.findById(course);
    if (!existingCourse) throw new Error("Course not found");

    const already = await Enrollment.findOne({ course, student: user._id });
    if (already) throw new Error("User already enrolled in this course");

    const newEnrollment = new Enrollment({
      student: user._id,
      course,
    });

    const saved = await newEnrollment.save();
    
    // Initialize progression records for the new student
    await initializeCourseProgress(user._id, course);

    // Trigger welcome email (background task)
    await addEmailJob('welcome', {
      to: user.email,
      username: user.username,
      courseTitle: existingCourse.title,
    });

    logInfo(`Enrollment & Progress created: ${saved._id}`);
    return saved;
  } catch (error) {
    logError(`Error creating enrollment: ${error.message}`);
    throw error;
  }
};

export const getAllEnrollmentsService = async ({
  filter = {},
  options = null,
} = {}) => {
  if (!options)
    return await Enrollment.find(filter)
      .populate("student", "username email")
      .populate("course", "title");

  const total = await Enrollment.countDocuments(filter);
  const items = await Enrollment.find(filter)
    .populate("student", "username email")
    .populate("course", "title")
    .sort(options.sort || undefined)
    .skip(options.skip)
    .limit(options.limit)
    .select(options.select || undefined);

  return {
    items,
    pagination: {
      total,
      page: options.page,
      limit: options.limit,
      pages: Math.ceil(total / options.limit),
    },
  };
};

export const getEnrollmentsByUserService = async (userId) => {
  return await Enrollment.find({ student: userId }).populate("course", "title");
};

export const getEnrollmentByIdService = async (id) => {
  const enrol = await Enrollment.findById(id)
    .populate("student", "username email")
    .populate("course", "title");
  if (!enrol) throw new Error("Enrollment not found");
  return enrol;
};

export const updateEnrollmentService = async (id, updateData, user) => {
  try {
    const enrol = await Enrollment.findById(id);
    if (!enrol) throw new Error("Enrollment not found");

    // only owner student or admin can update
    if (
      enrol.student.toString() !== user._id.toString() &&
      user.role !== "admin"
    ) {
      throw new Error("Not authorized to update this enrollment");
    }

    Object.assign(enrol, updateData);
    const updated = await enrol.save();

    logInfo(`Enrollment updated: ${updated._id}`);
    return updated;
  } catch (error) {
    logError(`Error updating enrollment: ${error.message}`);
    throw error;
  }
};

export const deleteEnrollmentService = async (id, user) => {
  const enrol = await Enrollment.findById(id);
  if (!enrol) throw new Error("Enrollment not found");

  if (
    enrol.student.toString() !== user._id.toString() &&
    user.role !== "admin"
  ) {
    throw new Error("Not authorized to delete this enrollment");
  }

  // ✅ Fix #17: No longer pull from Course.students[] (field removed)
  await enrol.deleteOne();

  logInfo(`Enrollment deleted: ${id}`);
  return true;
};
