import blackListedTokensRepository from "../DB/Repositories/black-listed-tokens.repository.js"
import userRepository from "../DB/Repositories/user.repository.js"
import { verifyToken } from "../Utils/tokens.utils.js"
import { BadRequestError, NotFoundError, UnauthorizedError } from "../Common/Errors/index.js"

export const authenticationMiddleware = async (req, res, next) => {
    const { accesstoken } = req.headers
    if (!accesstoken) throw new BadRequestError("Please provide an access token");

    const decodedData = verifyToken(accesstoken, process.env.JWT_ACCESS_SECRET)
    if (!decodedData?.jti) {
        throw new UnauthorizedError("Invalid token");
    }

    const blackListedToken = await blackListedTokensRepository.findByTokenId(decodedData.jti)
    if (blackListedToken) {
        throw new UnauthorizedError("Token is blacklisted");
    }

    // Fetch the full user (minus the password) instead of ONLY the
    // password field, and check for existence BEFORE using the result.
    // (Previously this also force-set every logged-in user's role to
    // "admin", which was a critical privilege-escalation bug.)
    const user = await userRepository.findById(decodedData?._id).select('-password').lean()
    if (!user) {
        throw new NotFoundError("User not found");
    }

    req.loggedInUser = {user,token:{tokenId:decodedData.jti,expirationDate:decodedData.exp}}
    next()
}
