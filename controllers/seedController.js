import asyncHandler from "express-async-handler";
import User from "../models/UserModel.js";
import { ApiResponse, ApiError, ENVIRONMENT, USERS_DATA } from "../lib/index.js";

const checkPermission = () => {
    if (ENVIRONMENT !== "dev") {
        throw new ApiError(403, "Permission denied.");
    }
};

// =====================================================================================================================
// Seed Users
// =====================================================================================================================
export const seedUsers = asyncHandler(async (req, res) => {
    checkPermission();

    await User.deleteMany({});

    // Insert seed data
    const insertedUsers = await User.create(USERS_DATA);

    res.status(201).json(new ApiResponse(201, insertedUsers, "Users inserted successfully."));
});
