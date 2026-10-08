// "dotenv/config" MUST be the very first import. Several modules
// (e.g. src/Utils/encryption.utlis.js) read process.env at module
// load time, so loading dotenv after them left those values
// undefined and crashed the server on boot.
import "dotenv/config";
import express from "express";
import userRouter from "./src/Modules/User/user.controller.js";
import messageRouter from "./src/Modules/Messages/message.controller.js";
import dbConnection from "./src/DB/db.connection.js";
import cors from 'cors'
import helmet from "helmet"; 
// import { rateLimit } from 'express-rate-limit'
const app = express();

// Parsing middleware
app.use(express.json());

app.use('/uploads',express.static('uploads'))

const whitelist = process.env.WHITE_LISTED_ORIGINS?.split(",") || [];

const corsOptions = {
  origin: function (origin, callback) {
    console.log("The current origin is ", origin);

    // Postman أو طلبات بدون Origin
    if (!origin || whitelist.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  }
};

app.use(cors(corsOptions));

app.use(helmet( {
  referrerPolicy:{policy:'origin-when-cross-origin'}
}))



 dbConnection();

app.use("/api/users", userRouter);
app.use("/api/messages", messageRouter);

app.use((err, req, res, next) => {
  console.error(err.stack);

  // Our custom AppError subclasses (NotFoundError, BadRequestError, ...)
  // carry their own statusCode and a safe, user-facing message.
  // Anything else (an actual bug) still falls back to a generic 500
  // instead of leaking internals to the client.
  const statusCode = err.statusCode || err.cause || 500;
  const message = err.isOperational ? err.message : "something broke!!";

  const response = { message, err: err.message };
  if (err.details) response.errors = err.details;
  if (process.env.NODE_ENV === "dev") response.stack = err.stack;

  res.status(statusCode).json(response);
});

app.use((req, res) => {
  res.status(404).send("Not Found");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(` Server is running on port ${PORT}`);
});
