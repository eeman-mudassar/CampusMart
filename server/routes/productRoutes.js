
import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import Product from "../models/Product.js";

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDirectory = path.join(__dirname, "../uploads");

if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDirectory);
  },
  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() +
      "-" +
      Math.round(Math.random() * 1e9) +
      path.extname(file.originalname).toLowerCase();

    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPG, PNG, WEBP and GIF images are allowed."));
    }
  },
});

// GET: Fetch all products
router.get("/", async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST: Add product with optional image
router.post("/", upload.single("image"), async (req, res) => {
  try {
    const {
      name,
      sku,
      category,
      purchasePrice,
      price,
      stock,
      description,
    } = req.body;

    if (
      !name ||
      !sku ||
      !category ||
      purchasePrice === undefined ||
      purchasePrice === "" ||
      price === undefined ||
      price === ""
    ) {
      return res.status(400).json({
        message:
          "Name, SKU, category, purchase price, and selling price are required.",
      });
    }

    const cost = Number(purchasePrice);
    const sellingPrice = Number(price);
    const quantity = Number(stock ?? 0);

    if (
      !Number.isFinite(cost) ||
      cost < 0 ||
      !Number.isFinite(sellingPrice) ||
      sellingPrice < 0 ||
      !Number.isInteger(quantity) ||
      quantity < 0
    ) {
      return res.status(400).json({
        message: "Please enter valid prices and stock quantity.",
      });
    }

    const product = await Product.create({
      name,
      sku,
      category,
      purchasePrice: cost,
      price: sellingPrice,
      stock: quantity,
      description: description ?? "",
      image: req.file ? `/uploads/${req.file.filename}` : "",
    });

    res.status(201).json(product);
  } catch (error) {
    if (req.file) {
      fs.unlink(req.file.path, () => {});
    }

    res.status(error.code === 11000 ? 409 : 400).json({
      message:
        error.code === 11000
          ? "This SKU already exists."
          : error.message,
    });
  }
});

// PUT: Update product
router.put("/:id", upload.single("image"), async (req, res) => {
  try {
    const allowedFields = [
      "name",
      "sku",
      "category",
      "purchasePrice",
      "price",
      "stock",
      "description",
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (req.file) {
      updates.image = `/uploads/${req.file.filename}`;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        message: "No valid fields to update.",
      });
    }

    for (const field of ["name", "sku", "category"]) {
      if (updates[field] !== undefined) {
        updates[field] = String(updates[field]).trim();

        if (!updates[field]) {
          return res.status(400).json({
            message: `${field} cannot be empty.`,
          });
        }
      }
    }

    for (const field of ["purchasePrice", "price"]) {
      if (updates[field] !== undefined) {
        const value = Number(updates[field]);

        if (
          updates[field] === "" ||
          !Number.isFinite(value) ||
          value < 0
        ) {
          return res.status(400).json({
            message: `${field} must be a valid number.`,
          });
        }

        updates[field] = value;
      }
    }

    if (updates.stock !== undefined) {
      const value = Number(updates.stock);

      if (
        updates.stock === "" ||
        !Number.isInteger(value) ||
        value < 0
      ) {
        return res.status(400).json({
          message: "Stock must be a whole number of zero or more.",
        });
      }

      updates.stock = value;
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      updates,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!product) {
      return res.status(404).json({
        message: "Product not found.",
      });
    }

    res.json(product);
  } catch (error) {
    if (req.file) {
      fs.unlink(req.file.path, () => {});
    }

    res.status(error.code === 11000 ? 409 : 400).json({
      message:
        error.code === 11000
          ? "This SKU already exists."
          : error.message,
    });
  }
});

// DELETE: Remove product
router.delete("/:id", async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({
        message: "Product not found.",
      });
    }

    res.json({
      message: "Product deleted successfully.",
    });
  } catch (error) {
    res.status(400).json({
      message: error.message,
    });
  }
});

export default router;
