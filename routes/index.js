import { Router } from "express";

import { verifyToken, runValidation } from "../lib/index.js";
import * as VALIDATOR from "../validators/index.js";
import { registerUser, loginUser, loginWithSocial, refreshAccessToken } from "../controllers/authController.js";
import {
    confirmAccount,
    resendAccountConfirmationEmail,
    getUserProfile,
    getAllUsers,
    getCurrentUser,
    changeCurrentPassword,
    forgotPassword,
    resetPassword,
    updateAccountDetails,
    changeCurrentEmail,
    confirmChangeEmail,
    deleteUser,
    manageUserStatus
} from "../controllers/userController.js";
import { seedUsers } from "../controllers/seedController.js";


// Initialize routers
const authRouter = Router();
const userRouter = Router();
const seedRouter = Router();

// Auth routes
authRouter.post("/register", VALIDATOR.register, runValidation, registerUser);
authRouter.post("/login", VALIDATOR.login, runValidation, loginUser);
authRouter.post("/social-login", VALIDATOR.loginWithSocial, runValidation, loginWithSocial);
authRouter.patch("/refresh-access-token", VALIDATOR.refreshAccessToken, runValidation, refreshAccessToken);

// User routes
userRouter.get("/confirm-account", VALIDATOR.confirmAccount, runValidation, confirmAccount);
userRouter.get("/resend-confirmation-email", VALIDATOR.resendAccountConfirmationEmail, runValidation, resendAccountConfirmationEmail);
userRouter.get("/profile/:userId", VALIDATOR.getUserProfile, runValidation, getUserProfile);
userRouter.get("/forgot-password", VALIDATOR.forgotPassword, runValidation, forgotPassword);
userRouter.patch("/reset-password", VALIDATOR.resetPassword, runValidation, resetPassword);
userRouter.patch("/confirm-change-email", VALIDATOR.confirmChangeEmail, runValidation, confirmChangeEmail);

// Secured routes of users
userRouter.get("/", verifyToken("admin"), getAllUsers);
userRouter.get("/:id", verifyToken(), getCurrentUser);
userRouter.patch("/change-password", VALIDATOR.changePassword, runValidation, verifyToken(), changeCurrentPassword);
userRouter.put("/change-email", VALIDATOR.changeEmail, runValidation, verifyToken(), changeCurrentEmail);
userRouter.patch("/:id", verifyToken(), updateAccountDetails);
userRouter.delete("/:id", verifyToken("admin"), deleteUser);
userRouter.patch("/manage-user-status/:id", verifyToken("admin"), manageUserStatus);

// Routes for seeding
seedRouter.post("/users", seedUsers);

export {
  authRouter,
  userRouter,
  seedRouter
};