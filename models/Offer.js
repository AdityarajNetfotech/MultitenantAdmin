import mongoose from "mongoose";

const offerSchema = new mongoose.Schema({
    jobTitle:{
        type:String,
        required:true,
        trim:true,
    },
    priority:{
        type:String,
        enum:["Low", "Model", "High", "Critical"],
        default:"Low",
    },
    status:{
        type:String,
        enum:["Open", "In progress", "JD pending", "JD created", "Closed"],
        default:"Open"
    },
    dueDate:{
        type:Date,
        required:true
    },
    createdBy:{
        type: mongoose.Schema.Types.ObjectId,
        ref:"User",
        required: true,
    },
   assignedTo:{
    type: mongoose.Schema.Types.ObjectId,
    ref:"User",
   },
   description:{
    type:String,
    required:true,
   },
   skills:{
    type:[String],
    required:true
   },
   preferredSkills:{
    type:[String],
    default:[]
   },
   experience:{
    type:String,
    required:true,
   },
   positionAvailable:{
    type:Number,
    required:true
   },
   location:{
    type:String,
    required:true,
   },
   city:{
    type:String,
   },
   state:String,
   country:String,

   employmentType:{
    type:String,
    enum:["Full-Time","Part-Time", "Contract", "Internship", "Remote"],
    required:true
   },
   salary:{
    type:Number,
    required:true,
   },
   currency:{
    type:String,
    default:"INR",
   },
   attachments:{
    type:[String],
    default:[],
   },
   isJDCreated:{
    type:Boolean,
    default:false
   },
   companyName:{
    type:String,
    required:true,
   }
},{timestamps:true});

export default mongoose.model("Offer", offerSchema)