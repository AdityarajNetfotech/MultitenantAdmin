import mongoose from "mongoose";

const ticketSchema = new mongoose.Schema({
raisedBy:{
    type:mongoose.Schema.Types.ObjectId,
    ref:'User',
    required:true
},
role:{
    type:String,
    enum:["RMG", "HR"],
    required:true,
},
subject:{
    type: String,
    required:true,
    trim: true,
},
description:{
    type:String,
    required:true,
},
priority:{
type:String,
enum:["Low","Medium","High","Critical"],
default:"Low"

},
status:{
    type:String,
    enum:["Open", "In Progress", "Resolved", "Closed"],
    default:"Open"
},

assignedTo:{
    type: mongoose.Schema.Types.ObjectId,
    ref:"User",
    default:null,
},


}, {timestamps:true})

export default mongoose.model("Ticket", ticketSchema);