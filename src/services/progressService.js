import Progress from "../model/Progress.js";
import Lesson from "../model/Lesson.js";
import Enrollment from "../model/Enrollment.js";
import User from "../model/User.js";
import Course from "../model/Course.js";
import { logInfo, logError } from "../logs/logger.js";
import { addEmailJob } from "../config/queue.js";

/**
 * Initializes progress records for a new enrollment.
 * Unlocks the first lesson in the sequence.
 */
export const initializeCourseProgress = async (userId, courseId) => {
  try {
    const lessons = await Lesson.find({ course: courseId }).sort({ order: 1 });
    if (lessons.length === 0) return;

    // Create progress records for all lessons
    const progressRecords = lessons.map((lesson, index) => ({
      user: userId,
      course: courseId,
      lesson: lesson._id,
      status: index === 0 ? "unlocked" : "locked",
    }));

    await Progress.insertMany(progressRecords);
    logInfo(`Initialized progress for user ${userId} in course ${courseId}`);
  } catch (error) {
    logError(`Error initializing course progress: ${error.message}`);
    throw error;
  }
};

/**
 * Validates a quiz submission and updates student progress.
 */
export const submitQuizService = async (userId, lessonId, answers) => {
  try {
    const lesson = await Lesson.findById(lessonId);
    if (!lesson) throw new Error("Lesson not found");

    const quiz = lesson.quiz;
    if (!quiz || quiz.length === 0) {
      return await markLessonComplete(userId, lessonId);
    }

    // Basic scoring
    let correctCount = 0;
    quiz.forEach((q, index) => {
      if (answers[index] === q.correctAnswer) {
        correctCount++;
      }
    });

    const score = (correctCount / quiz.length) * 100;
    const passed = score >= (lesson.passScore || 80);

    const progress = await Progress.findOne({ user: userId, lesson: lessonId });
    if (!progress) throw new Error("Progress record not found");

    progress.attempts += 1;
    progress.quizScore = Math.max(progress.quizScore, score);
    progress.lastAccessedAt = Date.now();

    if (passed) {
      progress.status = "completed";
      progress.isCompleted = true;
      await progress.save();
      
      // Trigger congratulate and unlock notifications
      const user = await User.findById(userId);
      const course = await Course.findById(lesson.course);
      
      await addEmailJob('quizPass', {
        to: user.email,
        username: user.username,
        lessonTitle: lesson.title,
        score,
      });

      // Unlock next lesson
      await unlockNextLesson(userId, lesson.course, lesson.order, user);
    } else {
      await progress.save();
    }

    return { 
      score, 
      passed, 
      requiredScore: lesson.passScore || 80,
      attempts: progress.attempts 
    };
  } catch (error) {
    logError(`Error submitting quiz: ${error.message}`);
    throw error;
  }
};

const unlockNextLesson = async (userId, courseId, currentOrder, user) => {
  const nextLesson = await Lesson.findOne({ 
    course: courseId, 
    order: { $gt: currentOrder } 
  }).sort({ order: 1 });

  if (nextLesson) {
    await Progress.findOneAndUpdate(
      { user: userId, lesson: nextLesson._id },
      { status: "unlocked" }
    );
    logInfo(`Unlocked next lesson ${nextLesson._id} for user ${userId}`);
  } else {
    // Course completed!
    await Enrollment.findOneAndUpdate(
      { student: userId, course: courseId },
      { completed: true, progress: 100 }
    );
    logInfo(`User ${userId} completed course ${courseId}`);

    // Trigger Course Complete notification
    const course = await Course.findById(courseId);
    await addEmailJob('courseComplete', {
      to: user.email,
      username: user.username,
      courseTitle: course.title,
    });
  }
};

const markLessonComplete = async (userId, lessonId) => {
  const progress = await Progress.findOne({ user: userId, lesson: lessonId });
  if (progress) {
    progress.status = "completed";
    progress.isCompleted = true;
    await progress.save();
    
    const lesson = await Lesson.findById(lessonId);
    await unlockNextLesson(userId, lesson.course, lesson.order);
  }
  return { score: 100, passed: true };
};

/**
 * Gets the current progress state for a user in a course.
 */
export const getUserCourseProgressService = async (userId, courseId) => {
  const progress = await Progress.find({ user: userId, course: courseId })
    .populate("lesson", "title order videoUrl pdfUrl content passScore quiz assignment")
    .sort({ "lesson.order": 1 });
    
  return progress;
};

/**
 * Validates and submits an assignment project link, unlocking the next lesson.
 */
export const submitAssignmentService = async (userId, lessonId, projectLink) => {
  try {
    const lesson = await Lesson.findById(lessonId);
    if (!lesson) throw new Error("Lesson not found");

    if (!lesson.assignment || !lesson.assignment.requireProjectLink) {
      throw new Error("This lesson does not require a project link submission.");
    }

    if (!projectLink || !projectLink.startsWith("http")) {
      throw new Error("Please provide a valid project URL.");
    }

    const progress = await Progress.findOne({ user: userId, lesson: lessonId });
    if (!progress) throw new Error("Progress record not found");

    // Update submission
    progress.assignmentSubmission = {
      projectLink,
      submittedAt: Date.now()
    };
    
    // Mark as completed automatically
    progress.status = "completed";
    progress.isCompleted = true;
    await progress.save();

    // Trigger unlock logic
    const user = await User.findById(userId);
    await unlockNextLesson(userId, lesson.course, lesson.order, user);

    logInfo(`User ${userId} submitted assignment for lesson ${lessonId}`);

    return { 
      message: "Assignment submitted successfully! Next lesson unlocked.",
      passed: true 
    };
  } catch (error) {
    logError(`Error submitting assignment: ${error.message}`);
    throw error;
  }
};

