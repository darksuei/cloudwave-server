require("dotenv").config();

const express = require("express");
const app = express();
const cors = require("cors");
const bodyParser = require("body-parser");
const errorMiddleware = require("./middlewares/errorMiddleware");

const PORT = process.env.PORT || 5000;

// Database connection
require("./config/database.config");

// Routers
const userRouter = require("./routes/userRouter");
const fileRouter = require("./routes/filesRouter");
const Storage = require("./services/storage");

app.use(cors());
app.use(errorMiddleware);
app.use("/uploads", express.static("uploads"));

// Parse incoming requests
app.use(bodyParser.json());
app.use(express.json());

// Register routers
app.use("/api", userRouter);
app.use("/api", fileRouter);

// Login to storage
Storage.getInstance();

// Health check endpoint
app.get("/health", async (_req, res) => {
  res.status(200).json({ message: "API is OK" });
});

// Handle Undefined Routes
app.get("*", (_req, res) => {
  res.status(404).json({ message: "Not found" });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
  console.log(`Server is running in ${process.env.NODE_ENV} mode.`);
});
