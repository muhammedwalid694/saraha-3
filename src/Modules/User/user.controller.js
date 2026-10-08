import { Router } from "express";
import {
  SignUpService, ConfirmEmailService, ListUsersService,
  SignInService, LogoutService, RefreshTokenService, SignUpServiceGmail,
  UpdateAccountService, UpdatePasswordService, DeleteAccountService
} from "./Services/user.service.js";
import { authenticationMiddleware } from "../../Middleware/authentication.middleware.js";
import { authorizationMiddleware } from "../../Middleware/authorization.middleware.js";
import { validationMiddleware } from "../../Middleware/validation.middleware.js";
import { SignUpSchema, SignUpGmailSchema } from "../../Validators/Schemas/uaer.schema.js";
import { Privillages } from "../../Common/enums/user.enum.js";

const router = Router();

// Auth
router.post('/register', validationMiddleware(SignUpSchema), SignUpService)
router.put('/Confirm', ConfirmEmailService)
router.post('/login', SignInService)
router.post('/refresh-token', RefreshTokenService)
router.post('/Logout', authenticationMiddleware, LogoutService)
router.post('/signup-gmail', validationMiddleware(SignUpGmailSchema), SignUpServiceGmail)

// Account
router.put('/update', authenticationMiddleware, UpdateAccountService)
router.put('/update-password', authenticationMiddleware, UpdatePasswordService)
router.delete('/delete', authenticationMiddleware, DeleteAccountService)

// Admin
router.get('/list', authenticationMiddleware, authorizationMiddleware(Privillages.ADMINS), ListUsersService)

export default router
