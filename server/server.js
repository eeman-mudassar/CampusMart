
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import authRoutes from "./routes/authRoutes.js";
import { ensureAdmin } from "./utils/ensureAdmin.js";

import productRoutes from "./routes/productRoutes.js";
import saleRoutes from "./routes/saleRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use("/uploads", express.static("uploads"));
app.get("/", (req, res) => {
  res.json({
    message: "CampusMart POS API is running!",
    status: "success",
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    application: "CampusMart",
    backend: "connected",
    database:
      mongoose.connection.readyState === 1
        ? "connected"
        : "disconnected",
  });
});

app.use("/api/products", productRoutes);
app.use("/api/sales", saleRoutes);
app.use("/api/auth", authRoutes);

async function startServer() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is missing from the .env file");
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected successfully!");
    await ensureAdmin();

    app.listen(PORT, () => {
      console.log(
        `CampusMart backend running at http://localhost:${PORT}`
      );
    });
  } catch (error) {
    console.error("Startup error:", error.message);
    process.exit(1);
  }
}

startServer();
