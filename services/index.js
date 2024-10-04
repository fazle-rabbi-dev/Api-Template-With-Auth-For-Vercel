import asyncHandler from "express-async-handler";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { validationResult } from "express-validator";
// initialize firebase-admin
import admin from "firebase-admin";
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { serviceAccount } from "../lib/index.js";

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

import Users from "../models/UserModel.js";
import {
    successResponse,
    ApiError,
    sendEmail,
    DEVELOPER_EMAIL,
    PROJECT_NAME,
    JWT_SECRET,
    generateAccountConfirmationEmail,
    generateEmailChangeConfirmationEmail,
    generatePasswordResetEmail,
    generateNewLoginNotificationEmail,
    generatePasswordChangeNotificationEmail,
    generateEmailChangedNotificationEmail,
    generateRandomString,
    generateAccountConfirmationLink,
    generateEmailChangeConfirmationLink,
    generateResetPasswordLink,
    validateDocumentId,
    generateValidationError,
    validateUsername,
    isValidUrl,
    generateAccessAndRefereshTokens,
    findItemWithId
} from "../lib/index.js";


/*
 ***
 *** Auth Services ***
 ***
*/

// ╭────────────────────────────────────────────────────────╮
// │      Register User
// ╰────────────────────────────────────────────────────────╯
const registerUser = async ({ name, username, email, password }) => {
    const existingUser = await Users.findOne({
        $or: [{ username }, { email }]
    });

    if (existingUser) {
        const whichOneExists = existingUser.email === email ? "email" : "username";

        throw new ApiError(409, `A user already exists with the same ${whichOneExists}.`);
    }

    const userData = {
        name,
        username,
        email,
        authentication: {
            password
        }
    };

    const createdUser = await Users.create(userData);

    // Generate account confirmation token & link
    const confirmationToken = await generateRandomString();
    const confirmationLink = generateAccountConfirmationLink(createdUser._id.toString(), confirmationToken);

    // Store confirmationToken in db
    createdUser.authentication.confirmationToken = confirmationToken;
    await createdUser.save();

    // Send account confirmation email
    const htmlEmailTemplate = generateAccountConfirmationEmail(createdUser.name, confirmationLink);
    await sendEmail(createdUser.email, `${PROJECT_NAME} Account confirmation`, htmlEmailTemplate);

    const userObject = {
        ...createdUser.generateSafeObject(),
        confirmationToken
    };

    return userObject;
};

// ╭────────────────────────────────────────────────────────╮
// │      Login User
// ╰────────────────────────────────────────────────────────╯
const loginUser = async (username, email, password, headers) => {
    const user = await Users.findOne({
        $or: [{ username }, { email }]
    }).select(
        "+authentication.password +authentication.isAccountConfirmed +authentication.role +authentication.authType +isBanned"
    );

    if (!user) {
        throw new ApiError(404, "Oops! We couldn't find a user with the provided email or username.");
    }

    // Check if user has already an account created using either google or github
    const { authType } = user.authentication;
    if (authType !== "email+password") {
        throw new ApiError(409, `You have already an account created using ${authType}. Try to login with ${authType}`);
    }

    const isPasswordCorrect = await user.isPasswordCorrect(password);

    if (!isPasswordCorrect) {
        throw new ApiError(401, "Incorrect username or password. Please try again.");
    }

    if (user.isBanned) {
        throw new ApiError(
            403,
            `Your account has been temporarily suspended. For assistance, please contact our support team at [${DEVELOPER_EMAIL}]. Thank you for your understanding.`
        );
    }

    if (!user.authentication.isAccountConfirmed) {
        throw new ApiError(
            403,
            "Account Not Confirmed. Your account needs to be confirmed. Please check your email inbox for the confirmation link."
        );
    }

    /****
      [*] Notify user about new login
    ****/
    
    // Get login info
    const loginTime = new Date().toLocaleString(); // or you can use `toISOString()` for UTC format
    const device = headers;
    
    // Send mail
    const newLogin = generateNewLoginNotificationEmail(user.username, loginTime, device);
    await sendEmail(user.email, "New login detected", newLogin);

    const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(user._id, user.authentication.role);

    const userObject = user.toObject();
    delete userObject.isBanned;
    userObject.authentication = {
        accessToken,
        refreshToken
    };

    return userObject;
};

// ╭────────────────────────────────────────────────────────╮
// │      Social Auth
// ╰────────────────────────────────────────────────────────╯
const loginWithSocial = async accessToken => {
    // Verify accessToken & find user
    let userRecord;
    try {
        userRecord = await getAuth().verifyIdToken(accessToken);
    } catch (error) {
        throw new ApiError(400, "Invalid token");
    }

    if (!userRecord) {
        throw new ApiError(404, "User not found. Invalid token");
    }

    const {
        name,
        email,
        firebase: { sign_in_provider }
    } = userRecord;
    const authType = sign_in_provider.split(".")[0];

    console.log({ userRecord, authType });

    // Check if user exists in database
    let existingUser = await Users.findOne({ email }).select("+authentication.password +authentication.authType");

    console.log({ existingUser });

    // Check if user has already an account created using provided email with a password
    if (existingUser && !["github", "google"].includes(existingUser?.authentication.authType)) {
        throw new ApiError(409, "Your email is associated with an account. Please login with your email & password");
    }

    // Create new account or Login to existing account
    let newUserAccount;
    let loginAccessToken = null;

    // Create account if user has no account
    if (!existingUser) {
        const newUser = {
            name,
            username: name.toLowerCase().replaceAll(" ", "") + Date.now(),
            email,
            authentication: {
                password: Date.now(),
                isAccountConfirmed: true,
                authType
            }
        };

        console.log({ existingUser });

        const createdUser = await Users.create(newUser);
        console.log({ createdUser });

        // Login to new account
        const user = await Users.findOne({ email })?.select("+authentication.password");

        console.log({ loggedInUser: user });

        if (user) {
            delete user.authentication.password;
            newUserAccount = user;
            loginAccessToken = jwt.sign({ userId: user._id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });
        }
    }

    // Login if user has already an account
    if (existingUser) {
        loginAccessToken = jwt.sign({ userId: existingUser._id, email: existingUser.email }, JWT_SECRET, {
            expiresIn: "7d"
        });
        delete existingUser.authentication.password;
    }

    let userData = {};
    if (existingUser) {
        userData = existingUser.generateSafeObject();
    } else {
        userData = newUserAccount;
    }
    
    return {
        message: `Logged in successfully using ${authType}.`,
        data: { user: { ...userData, accessToken: loginAccessToken } }
    };
};

// ╭────────────────────────────────────────────────────────╮
// │      Refresh Access Token
// ╰────────────────────────────────────────────────────────╯
const refreshAccessToken = async (userId, refreshToken) => {
    console.log({ userId, refreshToken });

    const currentUser = await Users.findById(userId);

    if (!currentUser) {
        throw new ApiError(404, "User does not exists.");
    }

    if (currentUser.authentication.refreshToken !== refreshToken) {
        throw new ApiError(
            401,
            "The refresh token provided is invalid or has expired. Please login again to obtain a new refresh token."
        );
    }

    const { accessToken: newAccessToken, refreshToken: newRefreshToken } = await generateAccessAndRefereshTokens(userId);
    currentUser.authentication.refreshToken = newRefreshToken;
    await currentUser.save();

    return {
        newAccessToken,
        newRefreshToken
    };
};


/*
 ***
 *** User Services ***
 ***
*/

// ╭────────────────────────────────────────────────────────╮
// │      Resend account confirmation email
// ╰────────────────────────────────────────────────────────╯
const resendAccountConfirmationEmail = async email => {
    const currentUser = await Users.findOne({ email }).select(
        "+authentication.isAccountConfirmed +authentication.confirmationToken"
    );
    if (!currentUser) {
        throw new ApiError(
            200,
            `If your account exists, a new confirmation email has been sent to (${email}). Please check your inbox.`
        );
    }

    if (currentUser.authentication.isAccountConfirmed) {
        throw new ApiError(409, "Your account is already confirmed. Feel free to log in.");
    }

    // Generate account confirmation token & link
    const confirmationToken = await generateRandomString();
    const confirmationLink = generateAccountConfirmationLink(currentUser._id.toString(), confirmationToken);

    // Store confirmationToken in db
    currentUser.authentication.confirmationToken = confirmationToken;
    await currentUser.save();

    // Send account confirmation email
    const htmlEmailTemplate = generateAccountConfirmationEmail(currentUser.name, confirmationLink);
    await sendEmail(currentUser.email, `${PROJECT_NAME} Account confirmation`, htmlEmailTemplate);

    const userObject = currentUser.toObject();
    userObject.authentication = {
        confirmationToken
    };

    return userObject;
};

// ╭────────────────────────────────────────────────────────╮
// │      Confirm account
// ╰────────────────────────────────────────────────────────╯
const confirmAccount = async (userId, confirmationToken) => {
    const select = "+authentication.confirmationToken +authentication.isAccountConfirmed";

    const currentUser = await findItemWithId(Users, userId);

    if (currentUser.authentication.isAccountConfirmed) {
        throw new ApiError(400, "Hey there! Your account is already confirmed. Feel free to log in.");
    }

    if (currentUser.authentication.confirmationToken !== confirmationToken) {
        throw new ApiError(400, "Uh-oh! The account confirmation token provided is invalid.");
    }

    currentUser.authentication.isAccountConfirmed = true;
    currentUser.authentication.confirmationToken = "";
    await currentUser.save();

    return currentUser.generateSafeObject();
};

// ╭────────────────────────────────────────────────────────╮
// │      Get loggedin user
// ╰────────────────────────────────────────────────────────╯
const getCurrentUser = async (id, loggedInUserId) => {
    if (id !== loggedInUserId) {
        throw new ApiError(403, "Sorry, you don't have permission to perform this operation. Please provide a valid user id.");
    }

    const currentUser = await Users.findById(loggedInUserId).select("+authentication.refreshToken +isBanned");
    if (!currentUser) {
        throw new ApiError(404, "User does not exists.");
    }

    if (currentUser.isBanned) {
        throw new ApiError(
            403,
            "Your account has been temporarily suspended. For assistance, please contact our support team at [demo@gmail.com]. Thank you for your understanding."
        );
    }

    return currentUser.generateSafeObject();
};

// ╭────────────────────────────────────────────────────────╮
// │      Get user public profile
// ╰────────────────────────────────────────────────────────╯
const getUserPublicProfile = async (userId) => {
    const user = await Users.findById(userId).select("+isBanned");
    
    if (!user) {
        throw new ApiError(404, "User does not exists.");
    }

    if (user.isBanned) {
        throw new ApiError(
            403,
            "Your account has been temporarily suspended. For assistance, please contact our support team at [demo@gmail.com]. Thank you for your understanding."
        );
    }

    return {
      _id: user._id,
      username: user.username,
      name: user.name,
      avatar: user.avatar
    }
};

// ╭────────────────────────────────────────────────────────╮
// │      Change current password
// ╰────────────────────────────────────────────────────────╯
const changeCurrentPassword = async (loggedInUserId, oldPassword, newPassword) => {
    const currentUser = await Users.findById(loggedInUserId).select("+authentication.password");

    if (!currentUser) {
        throw new ApiError(404, "User does not exist.");
    }

    const isPasswordCorrect = await currentUser.isPasswordCorrect(oldPassword);

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Incorrect old password. Please try again with the correct password.");
    }

    // Notify the user that their password has been changed
    const passwordChanged = generatePasswordChangeNotificationEmail(currentUser.username);
    await sendEmail(currentUser.email, "Password changed", passwordChanged);

    currentUser.authentication.password = newPassword;
    const savedUser = await currentUser.save();

    return currentUser.generateSafeObject();
};

// ╭────────────────────────────────────────────────────────╮
// │      Forgot password
// ╰────────────────────────────────────────────────────────╯
const forgotPassword = async email => {
    const currentUser = await Users.findOne({ email }).select("+authentication.resetPasswordToken");

    if (!currentUser) {
        throw new ApiError(200, `If your account exists, an email has been sent to (${email}) with further instructions.`);
    }

    const resetPasswordToken = await generateRandomString();
    const resetPasswordLink = generateResetPasswordLink(currentUser._id.toString(), resetPasswordToken);

    // Store resetToken in db
    currentUser.authentication.resetPasswordToken = resetPasswordToken;
    await currentUser.save();

    // Send reset password email
    const htmlEmailTemplate = generatePasswordResetEmail(currentUser.name, resetPasswordLink);
    await sendEmail(currentUser.email, `${PROJECT_NAME} Password Reset`, htmlEmailTemplate);
};

// ╭────────────────────────────────────────────────────────╮
// │      Reset password
// ╰────────────────────────────────────────────────────────╯
const resetPassword = async (userId, resetPasswordToken, newPassword) => {
    const currentUser = await Users.findById(userId).select("+authentication.resetPasswordToken +authentication.password");

    if (!currentUser) {
        throw new ApiError(404, "User not found. Please ensure your userId is valid.");
    }

    if (currentUser.authentication.resetPasswordToken !== resetPasswordToken) {
        throw new ApiError(401, "You might have clicked on a broken link. Please request a new link to reset your password.");
    }

    currentUser.authentication.password = newPassword;
    currentUser.authentication.resetPasswordToken = "";
    await currentUser.save();

    return currentUser.generateSafeObject();
};

// ╭────────────────────────────────────────────────────────╮
// │      Update account details
// ╰────────────────────────────────────────────────────────╯
const updateAccountDetails = async data => {
    const { body, id, loggedInUserId } = data;
    const { name, username, avatarUrl } = body;

    if (id !== loggedInUserId) {
        throw new ApiError(403, "Sorry, you don't have permission to do this operation. Please provide a valid user id.");
    }

    // Validate fields for updates
    const allowedUpdates = ["name", "username", "avatarUrl"];
    const updates = Object.keys(body);
    const isValidOperation = updates.every(field => allowedUpdates.includes(field));

    if (updates.length === 0 || !isValidOperation) {
        throw new ApiError(400, "Invalid update. Please provide required fields to update account.");
    }

    if (name?.length < 3) {
        throw new ApiError(400, "name must be at least 3 characters long.");
    }

    if (username && !validateUsername(username.trim())) {
        throw new ApiError(
            400,
            "Invalid username. The username must start with a letter and contain only letters, numbers, and underscores."
        );
    }

    const existingUser = await Users.findOne({ username });

    if (existingUser) {
        throw new ApiError(409, "This username is already in use. Please provide a different username to update your username.");
    }

    const currentUser = await Users.findById(loggedInUserId);
    const updateFields = body;

    if (isValidUrl(avatarUrl)) {
        delete updateFields.avatarUrl;
        updateFields.avatar = {
            url: avatarUrl,
            id: Date.now()
        };
    }

    const updatedUser = await Users.findByIdAndUpdate(loggedInUserId, updateFields, { new: true, runValidation: true });

    return updatedUser.generateSafeObject();
};

// ╭────────────────────────────────────────────────────────╮
// │      Change email address
// ╰────────────────────────────────────────────────────────╯
const changeCurrentEmail = async (loggedInUserId, newEmail, password) => {
    const existingUser = await Users.findOne({ email: newEmail });

    if (existingUser) {
        throw new ApiError(409, "This email address is already in use. Please provide a different email address.");
    }

    const currentUser = await Users.findById(loggedInUserId).select("+authentication.password");
    const isPasswordCorrect = await currentUser.isPasswordCorrect(password);

    if (!isPasswordCorrect) {
        throw new ApiError(401, "Incorrect password. Please provide correct password and try again.");
    }

    // generate token & link
    const confirmationToken = await generateRandomString();
    const confirmationLink = generateEmailChangeConfirmationLink(currentUser._id, confirmationToken);

    // send email
    const htmlEmailTemplate = generateEmailChangeConfirmationEmail(currentUser.name, confirmationLink);

    await sendEmail(newEmail, `${PROJECT_NAME} Email change request`, htmlEmailTemplate);

    // store token & new email in db
    currentUser.authentication.changeEmailConfirmationToken = confirmationToken;
    currentUser.authentication.tempMail = newEmail;

    await currentUser.save();

    return currentUser.generateSafeObject();
};

// ╭────────────────────────────────────────────────────────╮
// │      Confirm email change
// ╰────────────────────────────────────────────────────────╯
const confirmChangeEmail = async (userId, confirmationToken) => {
    const existingUser = await Users.findById(userId).select(
        "+authentication.tempMail +authentication.changeEmailConfirmationToken"
    );

    if (!existingUser) {
        throw new ApiError(404, "User not found. Please ensure that you have clicked on the correct link.");
    }

    if (
        existingUser.authentication.changeEmailConfirmationToken !== confirmationToken ||
        !existingUser.authentication.tempMail.trim()
    ) {
        throw new ApiError(
            401,
            "Sorry, you don’t have permission to update this email address. Please click on the correct link."
        );
    }

    // Update email
    const oldEmail = existingUser.email;
    existingUser.email = existingUser.authentication.tempMail;

    // Remove tempMail & confirmationToken from db
    existingUser.authentication.changeEmailConfirmationToken = "";
    existingUser.authentication.tempMail = "";

    const updatedUser = await existingUser.save({ new: true });

    // Notify the user through their old email about the email change
    const emailChanged = generateEmailChangedNotificationEmail(existingUser.name);
    await sendEmail(oldEmail, "Email changed", emailChanged);

    return updatedUser.generateSafeObject();
};


/*
 ***
 *** Admin Dashboard Services ***
 ***
*/

const getAllUsers = async ({ page, limit, sortBy, order, fields, search }) => {
    // Pagination
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;
    const skip = (page - 1) * limit;

    // Sorting
    const sortField = sortBy || "createdAt";
    const sortOrder = order === "desc" ? -1 : 1;
    const sort = { [sortField]: sortOrder };

    // Partial response
    fields = fields ? fields.split(",") : [];

    // Search
    const searchValue = (search || "").trim();
    const filter = {
        "authentication.role": { $ne: "admin" },
        $or: [
            { name: { $regex: searchValue, $options: "i" } },
            { email: { $regex: searchValue, $options: "i" } },
            { username: { $regex: searchValue, $options: "i" } }
        ]
    };

    const users = await Users.find(filter).select(fields).sort(sort).limit(limit).skip(skip);
    if (!users || users.length === 0) {
        throw new ApiError(404, "Users not found.");
    }

    const count = await Users.find().countDocuments();
    const totalPages = Math.ceil(count / limit);

    return {
        users,
        totalPages,
        page,
        totalUsers: users.length
    };
};

const deleteUser = async userId => {
    const existingUser = await findItemWithId(Users, userId);

    const deletedUser = await Users.deleteOne({
        _id: userId,
        "authentication.role": "user"
    });
};

const manageUserStatus = async (userId, action) => {
    if (!["ban", "unban"].includes(action)) {
        throw new ApiError(400, "Invalid action. The action must be either 'ban' or 'unban'.");
    }

    if (!validateDocumentId(userId)) {
        throw new ApiError(400, "Invalid user Id.");
    }

    const existingUser = await Users.findById(userId).select("+isBanned");

    if (!existingUser) {
        throw new ApiError(404, "User does not exists.");
    }

    if (action === "ban" && existingUser.isBanned) {
        throw new ApiError(409, "User is already banned.");
    }

    if (action === "unban" && !existingUser.isBanned) {
        throw new ApiError(409, "User is already unbanned.");
    }

    const updateFields = { isBanned: action === "ban" };
    const updatedUser = await Users.findByIdAndUpdate(userId, updateFields, { new: true }).select("+isBanned");

    const actionMessage = action === "ban" ? "banned" : "unbanned";

    return {
        updatedUser: updatedUser.generateSafeObject(),
        actionMessage
    };
};


// ╭────────────────────────────────────────────────────────╮
// │      Export all functions
// ╰────────────────────────────────────────────────────────╯
export const authService = {
    registerUser,
    loginUser,
    loginWithSocial,
    refreshAccessToken
};

export const userService = {
    resendAccountConfirmationEmail,
    confirmAccount,
    getAllUsers,
    getCurrentUser,
    getUserPublicProfile,
    changeCurrentPassword,
    forgotPassword,
    resetPassword,
    updateAccountDetails,
    changeCurrentEmail,
    confirmChangeEmail,
    deleteUser,
    manageUserStatus
};
