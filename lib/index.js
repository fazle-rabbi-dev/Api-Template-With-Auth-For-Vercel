/*
@README: This file contains multiple components
instead of being modularized because this API
is designed to be deployed on Vercel. Vercel 
doesn't support more than 12 serverless 
functions, so to keep the JavaScript files under 12,
I designed the API code this way.
*/

import mongoose from "mongoose";
import crypto from "crypto";
import winston from "winston";
import nodemailer from "nodemailer";
import chalk from "chalk";
import { rateLimit } from 'express-rate-limit';
import jwt from "jsonwebtoken";
import { validationResult } from "express-validator";
import asyncHanlder from "express-async-handler";

import UserModel from "../models/UserModel.js";

// =====================================================================================================================
// Constants Starts Here
// =====================================================================================================================
export const USERS_DATA = [
  {
    name: "John Doe",
    username: "johndoe",
    email: "johndoe@example.com",
    authentication: {
      password: "password123",
      role: "user",
      isAccountConfirmed: true
    }
  },
  {
    name: "Jane Smith",
    username: "janesmith",
    email: "janesmith@example.com",
    authentication: {
      password: "password123",
      role: "admin",
      isAccountConfirmed: true
    }
  }
];

export const DB_NAME = "my-lab";
export const DEVELOPER_NAME = "Fazle Rabbi";
export const DEVELOPER_EMAIL = "fazlerabbidev@outlook.com";
export const ACCOUNT_CONFIRMATION_ROUTE =
  "http://localhost:3000/api/users/confirm-account";
export const EMAIL_CHANGE_CONFIRMATION_ROUTE =
  "http://localhost:3000/api/users/confirm-change-email";
export const RESET_PASSWORD_ROUTE =
  "http://localhost:3000/api/users/reset-password";
export const ALLOWED_CORS_ORIGIN = ["http://localhost:5173"];
// Front-end app name to display in: confirmation email, password reset email etc.
export const PROJECT_NAME = "Auth Api Template";
export const DOCUMENTATION_URL = "http://localhost:3000/api-docs";

/**** Constants Ends Here ****/

// =====================================================================================================================
// Secret Data From .env File
// =====================================================================================================================
const getEnv = name => {
  return process.env[name];
};

export const PORT = getEnv("PORT");
export const MONGODB_URI = getEnv("MONGODB_URI");
export const JWT_SECRET = getEnv("JWT_SECRET");
export const ACCESS_TOKEN_SECRET = getEnv("ACCESS_TOKEN_SECRET");
export const REFRESH_TOKEN_SECRET = getEnv("REFRESH_TOKEN_SECRET");
export const ACCESS_TOKEN_EXPIRY = getEnv("ACCESS_TOKEN_EXPIRY");
export const REFRESH_TOKEN_EXPIRY = getEnv("REFRESH_TOKEN_EXPIRY");
export const CLOUDINARY_CLOUD_NAME = getEnv("CLOUDINARY_CLOUD_NAME");
export const CLOUDINARY_API_KEY = getEnv("CLOUDINARY_API_KEY");
export const CLOUDINARY_API_SECRET = getEnv("CLOUDINARY_API_SECRET");
export const GMAIL_USERNAME = getEnv("GMAIL_USERNAME");
export const GMAIL_PASSWORD = getEnv("GMAIL_PASSWORD");
export const ENVIRONMENT = getEnv("ENVIRONMENT");

// =====================================================================================================================
// Api Response Handler
// =====================================================================================================================
export class ApiError extends Error {
  constructor(statusCode, message, details) {
    super(message);
    this.statusCode = statusCode;
    this.details = details || "";
    Error.captureStackTrace(this, this.constructor);
  }
}

export const successResponse = (res, data = {}) => {
  const payload = {
    success: true,
    statusCode: data?.statusCode || 200,
    message: data?.message || "Success"
  };
  if (data.data) payload.data = data.data;
  res.status(data?.statusCode || 200).json(payload);
};

// =====================================================================================================================
// Email Operations
// =====================================================================================================================
export const generateAccountConfirmationEmail = (userName, link) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Account Confirmation</title>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@100..900&family=Patrick+Hand&display=swap');
            
            body {
                font-family: Inter, Arial, sans-serif;
                background-color: #f2f2f2;
                padding: 20px;
            }
            .container {
                background-color: #ffffff;
                border-radius: 10px;
                padding: 20px;
                text-align: center;
            }
            h2 {
                color: #333333;
            }
            p {
                color: #666666;
            }
            .btn {
                background-color: #007bff;
                color: #ffffff;
                padding: 10px 20px;
                text-decoration: none;
                border-radius: 5px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h2>Hello ${userName},</h2>
            <p>Please click the button below to confirm your account:</p>
            <br />
            <a href="${link}" class="btn">Confirm Account</a>
            <p><br />Regards,<br>${DEVELOPER_NAME}</p>
        </div>
    </body>
    </html>
    `;
};

export const generatePasswordResetEmail = (userName, link) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset</title>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@100..900&family=Patrick+Hand&display=swap');
            
            body {
                font-family: Inter, Arial, sans-serif;
                background-color: #f2f2f2;
                padding: 20px;
            }
            .container {
                background-color: #ffffff;
                border-radius: 10px;
                padding: 20px;
                text-align: center;
            }
            h2 {
                color: #333333;
            }
            p {
                color: #666666;
            }
            .btn {
                background-color: #007bff;
                color: #ffffff;
                padding: 10px 20px;
                text-decoration: none;
                border-radius: 5px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h2>Hello ${userName},</h2>
            <p>We received a request to reset your password. Click the button below to reset your password:</p>
            <br />
            <a href="${link}" class="btn">Reset Password</a>
            <p><br />If you didn't request this, you can safely ignore this email.</p>
            <p>Regards,<br>${DEVELOPER_NAME}</p>
        </div>
    </body>
    </html>
    `;
};

export const generateEmailChangeConfirmationEmail = (userName, link) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Confirmation</title>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@100..900&family=Patrick+Hand&display=swap');
            
            body {
                font-family: Inter, Arial, sans-serif;
                background-color: #f2f2f2;
                padding: 20px;
            }
            .container {
                background-color: #ffffff;
                border-radius: 10px;
                padding: 20px;
                text-align: center;
            }
            h2 {
                color: #333333;
            }
            p {
                color: #666666;
            }
            .btn {
                background-color: #007bff;
                color: #ffffff;
                padding: 10px 20px;
                text-decoration: none;
                border-radius: 5px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h2>Hello ${userName},</h2>
            <p>We received a request to add this email to a ${PROJECT_NAME} account. Click the button below to confirm your email address:</p>
            <br />
            <a href="${link}" class="btn">Confirm Email</a>
            <p><br />If you didn't request this, you can safely ignore this email.</p>
            <p>Regards,<br>${DEVELOPER_NAME}</p>
        </div>
    </body>
    </html>
    `;
};

export const sendEmail = async (recipient, subject, htmlContent) => {
  try {
    // Create a Nodemailer transporter using SMTP
    let transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587, // Your SMTP server port (usually 587 for TLS)
      secure: false, // true for 465, false for other ports
      auth: {
        user: GMAIL_USERNAME,
        pass: GMAIL_PASSWORD
      }
    });

    // Send mail with defined transport object
    let info = await transporter.sendMail({
      from: `${DEVELOPER_NAME} ${DEVELOPER_EMAIL}`,
      to: recipient,
      subject: subject,
      html: htmlContent
    });

    console.log(
      chalk.bold.yellow("\n✔ Message sent successfully: %s \n", info.messageId)
    );
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(
      chalk.bold.red("\n✘ Error occurred while sending email:\n", error)
    );
    return { success: false, error: error.message };
  }
};

// =====================================================================================================================
// Utilities
// =====================================================================================================================
export function validateDocumentId(inputId) {
  if (!inputId || !inputId.trim()) return false;

  try {
    const mongooseObjectId = new mongoose.Types.ObjectId(inputId);
    return true;
  } catch (error) {
    return false;
  }
}

export const generateRandomString = (length = 128) => {
  return new Promise((resolve, reject) => {
    crypto.randomBytes(length, (err, buffer) => {
      if (err) {
        reject(err);
      } else {
        // Use URL-safe base64 encoding
        const token = buffer
          .toString("base64")
          .replace(/\+/g, "-")
          .replace(/\//g, "_")
          .replace(/=+$/, ""); // Remove trailing '=' characters
        resolve(token);
      }
    });
  });
};

export const generateAccountConfirmationLink = (userId, confirmationToken) => {
  const confirmationLink = `${ACCOUNT_CONFIRMATION_ROUTE}?userId=${userId}&confirmationToken=${confirmationToken}`;
  return confirmationLink;
};

export const generateEmailChangeConfirmationLink = (
  userId,
  confirmationToken
) => {
  const confirmationLink = `${EMAIL_CHANGE_CONFIRMATION_ROUTE}?userId=${userId}&confirmationToken=${confirmationToken}`;
  return confirmationLink;
};

export const generateResetPasswordLink = (userId, resetPasswordToken) => {
  return `${RESET_PASSWORD_ROUTE}?userId=${userId}&resetPasswordToken=${resetPasswordToken}`;
};

export const generateValidationError = errors => {
  return errors.map(item => {
    return {
      field: item.path,
      message: item.msg
    };
  });
};

export function validateUsername(username) {
  if (!username || username.length < 3) {
    return false;
  }

  // starts with a letter, can contain letters, numbers, or hyphens, and ends with a letter or number
  const regex = /^[a-zA-Z][a-zA-Z0-9-]*[a-zA-Z0-9]$/;

  return regex.test(username);
}

// =====================================================================================================================
// Winston logger setup
// =====================================================================================================================
const timestamp12Hour = winston.format((info, opts) => {
  const date = new Date();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();
  const ampm = hours >= 12 ? "PM" : "AM";
  const formattedHours = hours % 12 || 12; // Convert 0 to 12 for 12-hour format
  const formattedMinutes = minutes < 10 ? "0" + minutes : minutes;
  const formattedSeconds = seconds < 10 ? "0" + seconds : seconds;

  info.timestamp = `${date.getFullYear()}-${
    date.getMonth() + 1
  }-${date.getDate()} ${formattedHours}:${formattedMinutes}:${formattedSeconds} ${ampm}`;
  return info;
});

const myFormat = winston.format.printf(({ level, message, timestamp }) => {
  return `${timestamp} ${level}: ${message}`;
});

export const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    timestamp12Hour(), // Use the custom 12-hour timestamp format
    winston.format.colorize(), // Apply colors
    myFormat // Use the custom format
  ),
  transports: [
    new winston.transports.Console() // Output to the console
  ]
});

// =====================================================================================================================
// Middlewares
// =====================================================================================================================
export const verifyToken =
    (requiredRole) =>
    (req, res, next) => {
        const authHeader = req.headers.authorization;
        const token = authHeader?.split(" ")[1];

        if (!authHeader || !token) {
            throw new ApiError(401, "🛑 Unauthorized access: Authorization header or token is missing.");
        }

        jwt.verify(token, JWT_SECRET, (err, user) => {
            if (err || (requiredRole && user.role !== requiredRole) ) {
                const message = err ? "👽 Authentication failed: Anomaly detected!" : "🚫 Access denied: Insufficient permissions.";
                
                throw new ApiError(err ? 401 : 403, message);
            }

            req.user = user;
            next();
        });
    };

export const runValidation = (req, res, next) => {
    try {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            throw new ApiError(400, errors.errors[0].msg);
        }

        next();
    } catch (error) {
        next(error);
    }
};

export const notFoundErrorHandler = asyncHanlder(async (req, res, next) => {
    throw new ApiError(404, "Oops! Route not found. You might have hit a dead endpoint.");
});

export const serverSideErrorHandler = (error, req, res, next) => {
    console.error({ ERROR: error });

    // Prepare ERROR Response Structure
    const errorObject = {
        success: false,
        statusCode: error?.statusCode || 500,
        message: (error?.statusCode && error?.message) || "Internal server error."
    };

    // Rate limit error handling
    if (error?.name === "RateLimitError") {
        errorObject.statusCode = 429;
        errorObject.error.message = "Too many requests, please try again later.";
    }

    res.status(error?.statusCode || 500).json(errorObject);
};

// =====================================================================================================================
// Misc
// =====================================================================================================================
export const generateAccessAndRefereshTokens = async (userId, role) => {
  try {
    const user = await UserModel.findById(userId);
    const accessToken = user.generateAccessToken(role);
    const refreshToken = user.generateRefreshToken(role);

    user.authentication.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    console.log(error);
    throw new ApiError(
      500,
      "Something went wrong while generating referesh and access token."
    );
  }
};

export const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 5, // limit each IP to 5 requests per windowMs
  handler: (req, res, next, err) => {
    next(err);
  }
});

export const corsOptions = {
  origin: ALLOWED_CORS_ORIGIN,
  methods: "GET,POST,PUT,PATCH,DELETE",
  allowedHeaders: "Content-Type,Authorization",
  credentials: true // Allow credentials (cookies, HTTP authentication) to be sent with requests.
};

export const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${MONGODB_URI}/${DB_NAME}`
    );
    logger.info("MongoDB connected");
  } catch (error) {
    console.log(chalk.bold.red("MONGODB connection FAILED "), error);
    process.exit(1);
  }
};
