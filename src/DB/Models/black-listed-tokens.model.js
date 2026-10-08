
import mongoose from "mongoose";

const blackListedTokensSchema = new mongoose.Schema({
  tokenId: { type: String, required: true, unique: true },
  expirationDate: { type: Date, required: true },
  userId: { type: String, ref: "user" }
});

const BlackListedTokens = mongoose.model("BlackListedTokens", blackListedTokensSchema);
export default BlackListedTokens;
