import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true
  },
  receiverId: {
    // The User model's _id is now a String (the user's email), not an
    // ObjectId, so this must be a String to correctly populate/ref it.
    type: String,
    ref: "user" // must match mongoose.model("user", ...) exactly (case-sensitive)
  }
}, {
  timestamps: true
});

const Messages = mongoose.model("Messages", messageSchema);
export default Messages;  
