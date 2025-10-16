import mongoose from "mongoose";
const PromotionSchema = new mongoose.Schema({
   code: {
      type: String,
      required: true,   
      unique: true,
   },
   discountType: { type:String, enum["percentage","fixed"], default:"percentage"}, 
   },
   discountValue:{
      type:Number,
      required:true,
   },
   validFrom: {
      type: Date,
      required: true,
   },
   validTo: {
      type: Date,
      required: true,
   },
   isActive: {
      type: Boolean,
      default:false,
   }, 
   {timespan: true}
});

const Promotion = mongoose.model("Promotion", PromotionSchema);   
export default Promotion;  
