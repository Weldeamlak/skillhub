// src/controllers/courseControllers.js
import {
  createCourseService,
  getCoursesService,
  getCourseByIdService,
  updateCourseService,
  deleteCourseService,
} from "../services/courseService.js";
import { buildQueryOptions } from "../utils/queryHelper.js";
import { logInfo, logError } from "../logs/logger.js";

export const createCourse = async (req, res) => {
  try {
    const course = await createCourseService(req.body, req.user);
    logInfo(`Course created: ${course.title}`);
    res.status(201).json({ message: "Course created successfully", course });
  } catch (error) {
    logError(error.message);
    res.status(400).json({ message: error.message });
  }
};

export const getCourses = async (req, res) => {
  try {
    const { filter, options } = buildQueryOptions(req.query, [
      "category",
      "price",
      "instructor",
      "title",
    ]);
    const result = await getCoursesService({ filter, options });
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getCourseById = async (req, res) => {
  try {
    const course = await getCourseByIdService(req.params.id);
    res.status(200).json(course);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

export const updateCourse = async (req, res) => {
  try {
    const course = await updateCourseService(req.params.id, req.body, req.user);
    res.status(200).json({ message: "Course updated successfully", course });
  } catch (error) {
    res.status(403).json({ message: error.message });
  }
};

export const deleteCourse = async (req, res) => {
  try {
    const course = await deleteCourseService(req.params.id);
    res.status(200).json({ message: "Course deleted successfully", course });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
