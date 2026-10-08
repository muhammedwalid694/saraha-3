import Joi from "joi";
import { isValidObjectId } from "mongoose";
import { GenderEnum } from "../../Common/enums/user.enum.js";

// The schema below was previously requiring fields (minAge, maxAge,
// testArray, skills...) that SignUpService never reads and the User
// model doesn't even have, so a normal registration request could
// never pass validation. It now matches what SignUpService actually
// uses and what the User model actually stores.
export const SignUpSchema = {
  body: Joi.object({
    firstName: Joi.string().alphanum().min(3).max(20).required().messages({
      "string.base": "first name must be a string",
      "any.required": "first name is required",
      "string.alphanum": "first name must contain only letters and numbers",
    }),
    lastName: Joi.string().alphanum().min(3).max(20).required(),
    email: Joi.string()
      .email({
        tlds: { allow: false },
        minDomainSegments: 2,
      })
      .required(),
    password: Joi.string()
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*])[A-Za-z\d@$!%*]{8,}$/)
      .required(),
    confirmPassword: Joi.string().valid(Joi.ref("password")).required(),
    gender: Joi.string().valid(...Object.values(GenderEnum)).optional(),
    phoneNumber: Joi.string().required(),
    age: Joi.number().min(1).max(120).required(),
  }),
};

// The Google sign-up endpoint only ever receives an idToken, so it gets
// its own dedicated schema instead of (incorrectly) reusing SignUpSchema.
export const SignUpGmailSchema = {
  body: Joi.object({
    idToken: Joi.string().required(),
  }),
};
