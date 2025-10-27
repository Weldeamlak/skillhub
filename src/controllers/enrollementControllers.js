import {
  createEnrollmentService,
  getAllEnrollmentsService,
  getEnrollmentsByUserService,
  getEnrollmentByIdService,
  updateEnrollmentService,
  deleteEnrollmentService,
} from "../services/enrollementService.js";
import { validationResult } from "express-validator";
import { logInfo, logError } from "../logs/logger.js";

export const createEnrollment = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ errors: errors.array() });

  try {
    const enrollment = await createEnrollmentService(req.body, req.user);
    logInfo(`Enrollment created for user ${req.user.email}`);
    res.status(201).json(enrollment);
  } catch (error) {
    logError(error.message);
    res.status(400).json({ message: error.message });
  }
};

export const getAllEnrollments = async (req, res) => {
  try {
    const enrollments = await getAllEnrollmentsService();
    res.status(200).json(enrollments);
  } catch (error) {
    logError(error.message);
    res.status(500).json({ message: error.message });
  }
};

export const getMyEnrollments = async (req, res) => {
  try {
    const enrollments = await getEnrollmentsByUserService(req.user._id);
    res.status(200).json(enrollments);
  } catch (error) {
    logError(error.message);
    res.status(500).json({ message: error.message });
  }
};

export const getEnrollmentById = async (req, res) => {
  try {
    const enrol = await getEnrollmentByIdService(req.params.id);
    res.status(200).json(enrol);
  } catch (error) {
    logError(error.message);
    res.status(404).json({ message: error.message });
  }
};

export const updateEnrollment = async (req, res) => {
  try {
    const updated = await updateEnrollmentService(
      req.params.id,
      req.body,
      req.user
    );
    res.status(200).json(updated);
  } catch (error) {
    logError(error.message);
    res.status(403).json({ message: error.message });
  }
};

export const deleteEnrollment = async (req, res) => {
  try {
    await deleteEnrollmentService(req.params.id, req.user);
    res.status(200).json({ message: "Enrollment deleted successfully" });
  } catch (error) {
    logError(error.message);
    res.status(403).json({ message: error.message });
  }
};
