import { Repository } from "./repository.js";
import messagesModel from "../Models/messages.model.js";

class MessagesRepository extends Repository {
  constructor() {
    super(messagesModel);
  }

  findAllWithReceiver(select = "firstName lastName") {
    return this.model.find().populate([{ path: "receiverId", select }]);
  }
}

export default new MessagesRepository();
