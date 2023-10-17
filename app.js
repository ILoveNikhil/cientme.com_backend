import express from "express";
import path from "path";
import { config } from "dotenv";
import cookieParser from "cookie-parser";
import fileUpload from "express-fileupload";
import cors from "cors";
import userRouter from "./routes/userRoute.js";
import postRouter from "./routes/postRouter.js";
// import storyRouter from "./routes/postRouter.js";
import bodyParser from "body-parser";
import { errorMiddleware } from "./middlewares/errorMiddleware.js";

// app
export const app = express();

// config
config({ path: "./config/.env" });

// Using Middlewares
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(fileUpload());
app.use(cors());

// Using Routes
app.use("/api/v1/user", userRouter);
app.use("/api/v1/post", postRouter);
// app.use("/api/v1/story", storyRouter);

// app.use(express.static(path.join(__dirname, "../frontend/build")));

// app.get("*", (req, res) => {
//   res.sendFile(path.resolve(__dirname, "../frontend/build/index.html"));
// });

// Middleware for Errors
app.use(errorMiddleware);
