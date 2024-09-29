import express from "express";
import cors from "cors";
import hpp from "hpp";
import morgan from "morgan";
import xssClean from "xss-clean";

import { corsOptions, serverSideErrorHandler, notFoundErrorHandler, limiter } from "./lib/index.js";
import { seedRouter, authRouter, userRouter } from "./routes/index.js";

const app = express();

app.use(hpp());
app.use(xssClean());
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(morgan(":method :url :status :res[content-length] - :response-time ms"));

// Routes declaration
app.use("/api/seed", seedRouter);
app.use("/api/auth", limiter, authRouter);
app.use("/api/users", userRouter);

// Home route
app.get("/", (req, res) => {
    res.status(200).json({
        statusCode: 200,
        message: "Home route."
    });
});

// Health route
app.get("/health", (req, res) => {
    res.status(200).json({
        status: "✅ ok",
        uptime: process.uptime(), // Current uptime of the Node.js process
        message: "🚀 API is healthy"
    });
});

app.use("*", notFoundErrorHandler);
app.use(serverSideErrorHandler);

export default app;
