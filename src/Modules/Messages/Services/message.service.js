import messagesRepository from "../../../DB/Repositories/messages.repository.js";
import userRepository from "../../../DB/Repositories/user.repository.js";
import { NotFoundError } from "../../../Common/Errors/index.js";

export const sendMessageService = async (req, res) => {
    const { content } = req.body
    const { receiverId } = req.params

    const user = await userRepository.findById(receiverId)
    if (!user) {
        throw new NotFoundError("User not found");
    }

    const message = await messagesRepository.create({
        content,
        receiverId
    })
    return res.status(200).json({ message: "message sent successfully", data: message })
}


export const getMessagesService = async (req, res) => {
    const messages = await messagesRepository.findAllWithReceiver()
    return res.status(200).json({ messages })
}
