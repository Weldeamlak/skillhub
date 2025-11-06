import {
  createLesson,
  getAllLessonsService,
  getLessonByIdService,
  updateLessonService,
  deleteLessonService,
} from "../services/lessonService.js";
import { logInfo, logError } from "../logs/logger.js";
import { buildQueryOptions } from "../utils/queryHelper.js";

// ✅ Create a new lesson
export const createLessonController = async (req, res) => {
  try {
    const savedLesson = await createLesson(req.body);
    logInfo(`Lesson created successfully: ${savedLesson.title}`);
    res.status(201).json(savedLesson);
  } catch (error) {
    logError(`Lesson creation failed: ${error.message}`);
    res.status(500).json({ message: error.message });
  }
};

// ✅ Get all lessons
export const getAllLessons = async (req, res) => {
  try {
    const { filter, options } = buildQueryOptions(req.query, [
      "course",
      "title",
    ]);
    const result = await getAllLessonsService({ filter, options });
    res.status(200).json(result);
  } catch (error) {
    logError(`Error fetching lessons: ${error.message}`);
    res.status(500).json({ message: error.message });
  }
};

// ✅ Get one lesson
export const getLessonById = async (req, res) => {
  try {
    const lesson = await getLessonByIdService(req.params.id);
    if (!lesson) return res.status(404).json({ message: "Lesson not found" });

    res.status(200).json(lesson);
  } catch (error) {
    logError(`Error fetching lesson by ID: ${error.message}`);
    res.status(500).json({ message: error.message });
  }
};

// ✅ Update lesson
export const updateLesson = async (req, res) => {
  try {
    const updatedLesson = await updateLessonService(req.params.id, req.body);
    if (!updatedLesson)
      return res.status(404).json({ message: "Lesson not found" });

    res.status(200).json(updatedLesson);
  } catch (error) {
    logError(`Error updating lesson: ${error.message}`);
    res.status(500).json({ message: error.message });
  }
};

// ✅ Delete lesson
export const deleteLesson = async (req, res) => {
  try {
    await deleteLessonService(req.params.id);
    res.status(200).json({ message: "Lesson deleted successfully" });
  } catch (error) {
    logError(`Error deleting lesson: ${error.message}`);
    res.status(500).json({ message: error.message });
  }
};
