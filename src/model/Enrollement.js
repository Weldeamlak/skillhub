import mongoose from "mongoose";
const EnrollemetSchema = new mongoose.Schema({
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
const Enrollment = mongoose.model('Enrollment', EnrollemetSchema);
export default Enrollment;