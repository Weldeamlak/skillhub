import Course from "../model/Course.js";
import Lesson from "../model/Lesson.js";
import Enrollment from "../model/Enrollment.js";
import { logInfo, logError } from "../logs/logger.js";
import { addEmailJob } from "../config/queue.js";
import { getSignedUrl, uploadToCloud } from "./storageService.js";

// ✅ Create a new lesson
export const createLesson = async (lessonData) => {
  try {
    const { title, course, video, pdf, content, quiz, order } = lessonData;

    const existingCourse = await Course.findById(course);
    if (!existingCourse) {
      throw new Error("Course not found");
    }

    const newLesson = new Lesson({
      title,
      course,
      order,
      video,
      pdf,
      content,
      quiz,
    });
    const savedLesson = await newLesson.save();

    existingCourse.lessons.push(savedLesson._id);
    await existingCourse.save();

    // Notify all enrolled students
    const enrollments = await Enrollment.find({ course }).populate("student", "username email");
    
    // Fire-and-forget background jobs for each student
    enrollments.forEach(enroll => {
      if (enroll.student) {
        addEmailJob("newLesson", {
          to: enroll.student.email,
          username: enroll.student.username,
          courseTitle: existingCourse.title,
          lessonTitle: savedLesson.title
        });
      }
    });

    logInfo(`Lesson created with ID: ${savedLesson._id} — Notifications queued for ${enrollments.length} students`);
    return savedLesson;
  } catch (error) {
    logError(`Error creating lesson: ${error.message}`);
    throw error;
  }
};

// ✅ Get all lessons — refined for weighted search (Phase 5)
export const getAllLessonsService = async ({
  filter = {},
  options = null,
} = {}) => {
  const query = Lesson.find(filter).populate("course", "title");
  
  // If text searching, MongoDB adds 'score' which isn't in schema, so we must project it
  if (filter.$text) {
     query.select({ score: { $meta: "textScore" } });
  }

  if (!options) return await query.exec();

  const total = await Lesson.countDocuments(filter);
  const docs = await query
    .sort(options.sort)
    .skip(options.skip)
    .limit(options.limit)
    .select(options.select)
    .exec();

  return {
    total,
    page: options.page,
    limit: options.limit,
    totalPages: Math.ceil(total / (options.limit || 1)),
    data: docs,
  };
};

// ✅ Get one lesson with SECURE, SIGNED URLs
export const getLessonByIdService = async (id, user = null) => {
  const lesson = await Lesson.findById(id).populate("course", "title instructor");
  if (!lesson) throw new Error("Lesson not found");

  const lessonObj = lesson.toObject();

  // If user is provided, generate signed URLs
  // In a real platform, we only sign if the student is enrolled and unlocked (middleware handles this)
  if (user) {
    if (lesson.video?.publicId) {
       lessonObj.video.signedUrl = getSignedUrl(lesson.video.publicId, 'video');
    }
    if (lesson.pdf?.publicId) {
       lessonObj.pdf.signedUrl = getSignedUrl(lesson.pdf.publicId, 'image'); // image resource type for pdf in cloudinary if not using 'raw'
    }
  }

  return lessonObj;
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

// ✅ Upload lesson video
export const uploadLessonVideoService = async (id, file, user) => {
  try {
    const lesson = await Lesson.findById(id).populate("course");
    if (!lesson) throw new Error("Lesson not found");
    
    // Authorization check
    if (lesson.course.instructor.toString() !== user._id.toString() && user.role !== "admin") {
      throw new Error("Not authorized to upload video to this lesson");
    }

    if (!file) throw new Error("No file provided");

    // Upload to our Cloudinary folder for lessons, as resource_type 'video'
    const result = await uploadToCloud(file.buffer, "skillhub/lessons/videos", "video");

    lesson.video = {
      publicId: result.public_id,
      provider: "cloudinary",
      duration: result.duration || 0,
    };
    
    await lesson.save();

    logInfo(`Lesson video uploaded: ${lesson.title}`);
    return lesson;
  } catch (error) {
    logError(`Error uploading lesson video: ${error.message}`);
    throw error;
  }
};
