import mongoose from "mongoose";
const lessonSchema = new mongoose.Schema({
   title: { type: String, required: true },
   course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
   order: { type: Number, required: true, default: 0 },
   video: {
      publicId: { type: String },
      provider: { type: String, default: 'cloudinary' },
      duration: { type: Number }, // in seconds
   },
   pdf: {
      publicId: { type: String },
      provider: { type: String, default: 'cloudinary' },
   },
   content: { type: String },
   passScore: { type: Number, default: 80 }, // required percentage to unlock next
   quiz: [{
      question: String,
      options: [String],
      correctAnswer: String,
   }],
   assignment: {
      prompt: String,
      requireProjectLink: { type: Boolean, default: false },
   },
},{
   timestamps: true,
});

// Index order within a course for fast sequenced fetching
lessonSchema.index({ course: 1, order: 1 });

const Lesson = mongoose.model("Lesson", lessonSchema);
export default Lesson;

