import asyncHandler from "express-async-handler";

import { successResponse } from "../lib/index.js";
import { authService } from "../services/index.js";


// Register User
export const registerUser = asyncHandler(async (req, res) => {
    const { name, username, email, password } = req.body;

    const user = await authService.registerUser({
        name,
        username,
        email,
        password,
    });

    successResponse(res, {
        statusCode: 201,
        message: "User registered successfully. Please check your email inbox to confirm your account.",
        data: { user }
    });
});

// Login User
export const loginUser = asyncHandler(async (req, res) => {
    const { username, email, password } = req.body;
    const headers = req.headers['user-agent'];
    const user = await authService.loginUser(username, email, password, headers);

    successResponse(res, {
        statusCode: 200,
        message: "User logged in successfully.",
        data: { user }
    });
});

// Social Login
export const loginWithSocial = asyncHandler(async (req, res) => {
    const { accessToken } = req.body;
    const {
      statusCode,
      message,
      data
    } = await authService.loginWithSocial(accessToken);

    successResponse(res, {
        statusCode,
        message,
        data
    });
});

// Refresh User Access Token
export const refreshAccessToken = asyncHandler(async (req, res) => {
    const { userId, refreshToken } = req.body;

    const { newAccessToken, newRefreshToken } = await authService.refreshAccessToken(userId, refreshToken);

    successResponse(res, {
        statusCode: 200,
        message: "Access token refreshed successfully.",
        data: {
            newAccessToken,
            newRefreshToken
        }
    });
});
