import mongoose from "mongoose";
const lessonSchema = new mongoose.Schema({
   title: { type: String, required: true },
   course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
   videoUrl: { type: String,},
   pdfUrl: { type: String, },
   content: { type: String, },
   quiz:[{
      question:String,
      options: [String],
      correctAnswer: String,
   },
   ],
   
},{
   timestamps: true,
});
const Lesson = mongoose.model("Lesson", lessonSchema);
export default Lesson;

