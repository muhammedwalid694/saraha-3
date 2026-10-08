import bcrypt, { compareSync } from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { nanoid } from 'nanoid';
import { OAuth2Client } from 'google-auth-library';
import userRepository from '../../../DB/Repositories/user.repository.js';
import messagesRepository from '../../../DB/Repositories/messages.repository.js';
import blackListedTokensRepository from '../../../DB/Repositories/black-listed-tokens.repository.js';
import { emitter } from '../../../Utils/send-email.ulils.js';
import { encrypt, decrypt } from '../../../Utils/encryption.utlis.js';
import { generateToken, verifyToken } from '../../../Utils/tokens.utils.js';
import { ProvidersEnum } from '../../../Common/enums/user.enum.js';
import { BadRequestError, ConflictError, NotFoundError } from '../../../Common/Errors/index.js';

// ===== Auth: sign up / confirm / list (05) =====
export const SignUpService = async (req, res, next) => {

  const { firstName, lastName, email, password, age, gender, phoneNumber } = req.body;

  const isEmailExist = await userRepository.findByEmail(email, ProvidersEnum.LOCAL);
  if (isEmailExist) {
    throw new ConflictError("Email already exists");
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  const confirmationOtp = nanoid(6);

  const newUser = await userRepository.create({
    firstName,
    lastName,
    email,
    password: hashedPassword,
    age,
    gender,
    phoneNumber: encrypt(phoneNumber), // Encryption (reversible) - see Utils/encryption.utlis.js
    otps: { confirmation: confirmationOtp }
  });

  emitter.emit('sendEmail', {
    to: email,
    subject: 'Email Confirmation',
    content: `<h2>Welcome ${firstName}!</h2>
                <p>Your confirmation code is: <b>${confirmationOtp}</b></p>`
  });

  return res.status(201).json({ message: 'User registered successfully, check your email for confirmation code', userId: newUser });
};

export const ConfirmEmailService = async (req, res, next) => {
  const { email, otp } = req.body;

  const user = await userRepository.findOne({ email, isConfirmed: false });
  if (!user) {
    throw new BadRequestError('User not found or already confirmed');
  }

  const isOtpMatched = otp === user.otps?.confirmation;
  if (!isOtpMatched) {
    throw new BadRequestError('Invalid OTP');
  }

  user.isConfirmed = true;
  user.otps.confirmation = undefined;

  await user.save();

  res.status(200).json({ message: "Confirmed" });
}

export const ListUsersService = async (req, res) => {
    let users = await userRepository.find()
    users = users.map((user) => {
        return {
            ...user._doc,
            phoneNumber: decrypt(user.phoneNumber)
        }
    })

    res.status(200).json({ users })
}

// ===== Auth: sign in / logout / refresh / google (11) =====
export const SignInService = async (req, res, next) => {
  const { email, password } = req.body;

  const user = await userRepository.findByEmail(email, ProvidersEnum.LOCAL);
  if (!user) {
    throw new NotFoundError("Invalid email or password");
  }

  const isPasswordMatch = compareSync(password, user.password);
  if (!isPasswordMatch) {
    throw new NotFoundError("Invalid email or password");
  }

  const accessToken = generateToken(
    { _id: user._id, email: user.email },
    process.env.JWT_ACCESS_SECRET,
    {
      expiresIn: "1h",
      jwtid: uuidv4()
    }
  )

  const refreshToken = generateToken(
  { _id: user._id, email: user.email },
  process.env.JWT_REFRESH_SECRET,
  { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN, jwtid: uuidv4() }
);

  const userData = user.toObject();
  delete userData.password;

  return res.status(200).json({
    message: "User signed in successfully",
    user: userData,
    accessToken,
    refreshToken
  });
};

export const LogoutService = async (req, res) => {
  const {token:{tokenId,expirationDate},user:{_id}}=req.loggedInUser

  await blackListedTokensRepository.create({
    tokenId,
    // expirationDate coming from the middleware is the JWT "exp" claim,
    // which is in seconds, so it must be multiplied by 1000 for Date().
    expirationDate : new Date(expirationDate * 1000),
    userId:  _id
  });

  return res.status(200).json({ message: "User logged out successfully" });
};

export const RefreshTokenService = async (req,res)=>{

  // Node/Express always lowercases incoming header names, so the header
  // must be read as `refreshtoken`, not `refreshToken` (which was always
  // undefined and made this endpoint throw on every request).
  const {refreshtoken} = req.headers;

  const decodedData = verifyToken(refreshtoken,process.env.JWT_REFRESH_SECRET)

  const accessToken = generateToken(
    {
      _id:decodedData._id , 
      email:decodedData.email
    },
    process.env.JWT_ACCESS_SECRET,
    {
      expiresIn: process.env.JWT_ACCESS_EXPIRES_IN,
      jwtid:uuidv4() 
    }
  )

  return res.status(200).json({message:"User token is refreshed successfully" , accessToken})
}

export const SignUpServiceGmail = async (req, res) => {
  const { idToken } = req.body;

  const client = new OAuth2Client();
  const ticket = await client.verifyIdToken({
    idToken,
    audience: process.env.WEB_CLIENT_ID,
  });

  const { email, given_name, family_name, email_verified, sub } = ticket.getPayload();
  if (!email_verified) {
    throw new BadRequestError("Email is not verified");
  }

  const isUserExist = await userRepository.findByGoogleSub(sub, ProvidersEnum.GOOGLE);
  let newUser;
  if (!isUserExist) {
    newUser = await userRepository.create({
        firstName: given_name,
        lastName: family_name || '',
        email,
        provider: ProvidersEnum.GOOGLE,
        isConfirmed: true,
        GoogleSub: sub,
        // Google users never log in with a password, so a random,
        // unusable value is stored just to satisfy the schema.
        password: bcrypt.hashSync(nanoid(32), 10)
    });
  } else {
    newUser = isUserExist
    isUserExist.firstName = given_name;
    isUserExist.lastName = family_name || '';
    await isUserExist.save();
  }

  const accessToken = generateToken(
    { _id: newUser._id, email: newUser.email },
    process.env.JWT_ACCESS_SECRET,
    {
      expiresIn: "1h",
      jwtid: uuidv4()
    }
  )

  const refreshToken = generateToken(
  { _id: newUser._id, email: newUser.email },
  process.env.JWT_REFRESH_SECRET,
  { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN, jwtid: uuidv4() }
);

  res.status(200).json({ message: "User signed up successfully", payload: newUser, accessToken, refreshToken });
};

// ===== Account: update / password / delete (04, 06) =====
export const UpdateAccountService = async (req, res) => {
  const {_id} = req.loggedInUser.user
  const { firstName, lastName, email, age, gender } = req.body;

  const updatedUser = await userRepository.findByIdAndUpdate(
    _id,
    { firstName, lastName, email, age, gender },
    { new: true }
  );

  if (!updatedUser) {
    throw new NotFoundError("User not found");
  }

  return res.status(200).json({ message: "User updated successfully", user: updatedUser });
};

// list

export const UpdatePasswordService = async (req, res) => {
  // req.loggedInUser is { user, token } — read the id from .user
  const { _id } = req.loggedInUser.user;
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    throw new BadRequestError("Please provide old and new password");
  }

  const user = await userRepository.findById(_id);
  if (!user) {
    throw new NotFoundError("User not found");
  }

  const isMatch = bcrypt.compareSync(oldPassword, user.password);
  if (!isMatch) {
    throw new BadRequestError("Old password is incorrect");
  }

  const hashedPassword = bcrypt.hashSync(newPassword, 10);
  user.password = hashedPassword;
  await user.save();

  return res.status(200).json({ message: "Password updated successfully" });
};

export const DeleteAccountService = async (req, res) => {
  const { _id } = req.loggedInUser.user

  const deletedUser = await userRepository.findByIdAndDelete(_id)
  if (!deletedUser) {
    throw new NotFoundError("User not found");
  }

  await messagesRepository.deleteMany({ receiverId: _id })

  return res.status(200).json({ message: "User deleted successfully", deletedUser })
}
