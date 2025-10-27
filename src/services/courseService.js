import Course from "../model/Course.js";
import Lesson from "../model/Lesson.js";
import { logInfo, logError } from "../logs/logger.js";

// ✅ Create a new lesson
export const createLesson = async (lessonData) => {
  try {
    const { title, course, videoUrl, pdfUrl, content, quiz } = lessonData;

    const existingCourse = await Course.findById(course);
    if (!existingCourse) {
      throw new Error("Course not found");
    }

    const newLesson = new Lesson({
      title,
      course,
      videoUrl,
      pdfUrl,
      content,
      quiz,
    });
    const savedLesson = await newLesson.save();

    existingCourse.lessons.push(savedLesson._id);
    await existingCourse.save();

    logInfo(`Lesson created with ID: ${savedLesson._id}`);
    return savedLesson;
  } catch (error) {
    logError(`Error creating lesson: ${error.message}`);
    throw error;
  }
};

// ✅ Get all lessons
export const getAllLessonsService = async () => {
  return await Lesson.find().populate("course", "title");
};

// ✅ Get one lesson
export const getLessonByIdService = async (id) => {
  return await Lesson.findById(id).populate("course", "title");
};

// ✅ Update lesson
export const updateLessonService = async (id, updateData) => {
  try {
    const lesson = await Lesson.findById(id);
    if (!lesson) {
      throw new Error("Lesson not found");
    }

    Object.assign(lesson, updateData);
    const updatedLesson = await lesson.save();

    logInfo(`Lesson updated: ${updatedLesson.title}`);
    return updatedLesson;
  } catch (error) {
    logError(`Error updating lesson: ${error.message}`);
    throw error;
  }
};

// ✅ Delete lesson
export const deleteLessonService = async (id) => {
  const lesson = await Lesson.findById(id);
  if (!lesson) throw new Error("Lesson not found");

  await Course.findByIdAndUpdate(lesson.course, { $pull: { lessons: id } });
  await lesson.deleteOne();

  logInfo(`Lesson deleted: ${lesson.title}`);
  return true;
};

// ✅ Create a new course
export const createCourseService = async (courseData, user) => {
  try {
    if (!courseData) throw new Error("Course data is required");

    const { title, description, price, category } = courseData;

    if (!title || !description || price === undefined || !category) {
      throw new Error(
        "Missing required course fields: title, description, price, category"
      );
    }

    const newCourse = new Course({
      title,
      description,
      price,
      category,
      instructor: user && user._id,
    });

    const savedCourse = await newCourse.save();
    logInfo(`Course created with ID: ${savedCourse._id}`);
    return savedCourse;
  } catch (error) {
    logError(`Error creating course: ${error.message}`);
    throw error;
  }
};

// ✅ Get all courses
export const getCoursesService = async () => {
  try {
    return await Course.find()
      .populate("instructor", "name email role")
      .populate("lessons");
  } catch (error) {
    logError(`Error fetching courses: ${error.message}`);
    throw error;
  }
};

// ✅ Get course by id
export const getCourseByIdService = async (id) => {
  try {
    const course = await Course.findById(id)
      .populate("instructor", "name email role")
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
    const course = await Course.findById(id);
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
    logInfo(`Course updated: ${updatedCourse.title}`);
    return updatedCourse;
  } catch (error) {
    logError(`Error updating course: ${error.message}`);
    throw error;
  }
};

// ✅ Delete course
export const deleteCourseService = async (id) => {
  try {
    const course = await Course.findById(id);
    if (!course) throw new Error("Course not found");

    // remove related lessons
    await Lesson.deleteMany({ course: id });

    // delete the course
    const deletedCourse = await Course.findByIdAndDelete(id);

    logInfo(`Course deleted: ${deletedCourse?.title || id}`);
    return deletedCourse;
  } catch (error) {
    logError(`Error deleting course: ${error.message}`);
    throw error;
  }
};
