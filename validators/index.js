import { body, query, check } from "express-validator";
import { validateUsername, validateDocumentId } from "../lib/index.js";

// Auth
export const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export const register = [
    body("name")
        .trim()
        .notEmpty()
        .withMessage("Name is required.")
        .isLength({ min: 4 })
        .withMessage("Name must be at least 4 characters long."),
    body("username")
        .trim()
        .notEmpty()
        .withMessage("User name is required.")
        .isLength({ min: 3, max: 15 })
        .withMessage("Username should be 3-15 characters long.")
        .custom((value, { req }) => {
            if (!validateUsername(value)) {
                throw new Error("Username is invalid. Username must be start with a character.");
            }
            return true;
        }),
    body("email").trim().normalizeEmail().isEmail().withMessage("Please provide a valid email address."),
    body("password").trim().isLength({ min: 6 }).withMessage("Password is required and must be at least 6 characters long.")
];

export const login = [
    body("email")
        .trim()
        .custom((email, { req }) => {
            const username = req.body.username?.trim() || "";

            // throw error when email/username both are missing
            if (!email && !username) {
                throw new Error("Missing username or email. A username or email address is required to proceed.");
            }

            // validate email address
            if (!username && !emailRegex.test(email)) {
                throw new Error("Invalid email address.");
            }

            // validate username
            if (!email && !validateUsername(username)) {
                throw new Error(
                    "Invalid username. It must be at least 3 characters long, can only contain letters (a-z), numbers (0-9), and underscores (_), and must start with a letter."
                );
            }

            return true;
        }),
    body("password").trim().isLength({ min: 6 }).withMessage("Password is required and must be at least 6 characters long.")
];

export const loginWithSocial = [body("accessToken").trim().notEmpty().withMessage("Invalid access token.")];

export const refreshAccessToken = [
    body("userId")
        .trim()
        .custom((userId, { req }) => {
            if (!validateDocumentId(userId)) {
                throw new Error("Invalid user ID. Please ensure you provide a valid userId in the request body.");
            }

            return true;
        }),
    body("refreshToken")
        .trim()
        .custom((value, { req }) => {
            if (!value || value?.length < 10) {
                throw new Error(
                    "Invalid refresh token. Please ensure you provide a valid refresh token in the request body to refresh your access token."
                );
            }
            return true;
        })
];

// Users
export const resendAccountConfirmationEmail = [
    query("email")
        .trim()
        .notEmpty()
        .withMessage("Email address is required. Please provide a valid email address as the query parameter.")
        .isEmail()
        .withMessage("Invalid email address.")
];

export const confirmAccount = [
    query("userId")
        .trim()
        .custom((userId, { req }) => {
            if (!validateDocumentId(userId)) {
                throw new Error("Invalid user ID. Please ensure you provide a valid userId as the query parameter.");
            }
            return true;
        }),
    query("confirmationToken")
        .trim()
        .custom((confirmationToken, { req }) => {
            if (!confirmationToken) {
                throw new Error("Oops! Looks like you forgot to include confirmationToken in the query parameter.");
            }
            return true;
        })
];

export const forgotPassword = [
    query("email")
        .trim()
        .notEmpty()
        .withMessage("Email address is required. Please provide a valid email address as the query parameter.")
        .isEmail()
        .withMessage("Invalid email address.")
];

export const resetPassword = [
    // userId, resetPasswordToken
    query("userId")
        .trim()
        .custom((value, { req }) => {
            if (!validateDocumentId(value)) {
                throw new Error("Invalid user id. Please ensure you provide a valid userId in the query parameter.");
            }
            return true;
        }),
    query("resetPasswordToken")
        .trim()
        .custom((value, { req }) => {
            if (!value || value?.length < 10) {
                throw new Error(
                    "Invalid reset password token. Please ensure you provide a valid token to reset your password in the query parameter."
                );
            }
            return true;
        }),
    body("newPassword")
        .trim()
        .isLength({ min: 6 })
        .withMessage("New password is required and must be at least 6 characters long."),
    body("confirmPassword")
        .trim()
        .isLength({ min: 6 })
        .withMessage("Confirm password is required and must be at least 6 characters long.")
        .custom((value, { req }) => {
            if (value !== req.body.newPassword) {
                throw new Error("New password & Confirm password did not match.");
            }

            return true;
        })
];

export const changePassword = [
    body("oldPassword")
        .trim()
        .isLength({ min: 6 })
        .withMessage("Old password is required and must be at least 6 characters long."),
    body("newPassword")
        .trim()
        .isLength({ min: 6 })
        .withMessage("New password is required and must be at least 6 characters long."),
    body("confirmPassword")
        .trim()
        .isLength({ min: 6 })
        .withMessage("Confirm password is required and must be at least 6 characters long.")
        .custom((value, { req }) => {
            if (value !== req.body.newPassword) {
                throw new Error("New password & Confirm password did not match.");
            }

            return true;
        })
];

export const changeEmail = [
    body("newEmail")
        .trim()
        .normalizeEmail()
        .isEmail()
        .withMessage("Invalid new email address. Please ensure you provide a valid new email address."),
    body("password").trim().isLength({ min: 6 }).withMessage("Invalid password. Password must be at least 6 characters long.")
];

export const confirmChangeEmail = [
    query("userId")
        .trim()
        .custom((userId, { req }) => {
            if (!validateDocumentId(userId)) {
                throw new Error("Invalid user ID. Please ensure you provide a valid userId as the query parameter.");
            }
            return true;
        }),
    query("confirmationToken")
        .trim()
        .custom((confirmationToken, { req }) => {
            if (!confirmationToken) {
                throw new Error("Oops! Looks like you forgot to include confirmationToken in the query parameter.");
            }
            return true;
        })
];

export const getUserProfile = [
    check("userId")
        .trim()
        .custom((userId, { req }) => {
            if (!validateDocumentId(userId)) {
                throw new Error("Invalid user ID. Please ensure you provide a valid userId as the query parameter.");
            }

            return true;
        })
];

export const updateAccount = [
    body("name").optional().trim().isLength({ min: 4 }).withMessage("Name is required and must be at least 4 characters long."),
    body("username")
        .optional()
        .trim()
        .notEmpty()
        .withMessage("User name is required.")
        .isLength({ min: 3 })
        .withMessage("Username must be at least 3 characters long.")
        .custom((value, { req }) => {
            if (!validateUsername(value)) {
                throw new Error("Username is invalid. Username must be start with a character.");
            }
            return true;
        })
];

export const manageUserStatus = [
    query("action").notEmpty().trim().withMessage("Action (ban/unban) is required in the query parameter."),

    check("userId")
        .trim()
        .custom((userId, { req }) => {
            if (!validateDocumentId(userId)) {
                throw new Error("Invalid user ID. Please ensure you provide a valid userId as the query parameter.");
            }

            return true;
        })
];
