import mongoose from "mongoose";
const EnrollmentSchema = new mongoose.Schema({
   student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
   },
   course: { 
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
   },
   progress: {
      type: Number,
      default: 0,
   },
   completed: {
      type: Boolean,
      default: false
   }
},{
    timestamps:true
})

// ✅ Fix #14: DB-level unique constraint prevents race-condition duplicate enrollments
EnrollmentSchema.index({ student: 1, course: 1 }, { unique: true });

const Enrollment = mongoose.model('Enrollment', EnrollmentSchema);
export default Enrollment;