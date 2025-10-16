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
