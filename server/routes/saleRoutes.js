import express from "express";
import mongoose from "mongoose";
import Product from "../models/Product.js";
import Sale from "../models/Sale.js";

const router = express.Router();

// GET: Sales history, newest first.
router.get("/", async (req, res) => {
  try {
    const sales = await Sale.find().sort({ createdAt: -1 });
    res.json(sales);
  } catch (error) {
    res.status(500).json({
      message: "Could not fetch sales history.",
      error: error.message,
    });
  }
});

// POST: Complete a sale, save purchase-cost snapshots, and reduce stock.
router.post("/", async (req, res) => {
  const { items, paymentMethod = "Cash" } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      message: "Cart is empty. Add products before checkout.",
    });
  }

  const allowedPayments = ["Cash", "Card", "Easypaisa", "JazzCash"];
  if (!allowedPayments.includes(paymentMethod)) {
    return res.status(400).json({ message: "Invalid payment method." });
  }

  for (const item of items) {
    if (
      !item.productId ||
      !mongoose.isValidObjectId(item.productId) ||
      !Number.isSafeInteger(item.quantity) ||
      item.quantity < 1
    ) {
      return res.status(400).json({
        message:
          "Each cart item needs a valid productId and positive whole-number quantity.",
      });
    }
  }

  // Combine repeated products in the same cart.
  const quantities = new Map();
  for (const item of items) {
    const id = String(item.productId);
    quantities.set(id, (quantities.get(id) || 0) + item.quantity);
  }

  const session = await mongoose.startSession();

  try {
    let completedSale;

    await session.withTransaction(async () => {
      const saleItems = [];
      let subtotal = 0;

      for (const [productId, quantity] of quantities) {
        // Read the current product and its prices from MongoDB, not from the browser.
        const product = await Product.findById(productId).session(session);

        if (!product) {
          const error = new Error(`Product ${productId} was not found.`);
          error.statusCode = 404;
          throw error;
        }

        // Only reduce stock if enough units are available.
        const updatedProduct = await Product.findOneAndUpdate(
          {
            _id: product._id,
            stock: { $gte: quantity },
          },
          { $inc: { stock: -quantity } },
          { new: true, session }
        );

        if (!updatedProduct) {
          const error = new Error(
            `Not enough stock for ${product.name}. Available stock: ${product.stock}.`
          );
          error.statusCode = 400;
          throw error;
        }

        const sellingPrice = Number(product.price);
        const purchasePrice = Number(product.purchasePrice ?? 0);
        const lineTotal = sellingPrice * quantity;
        subtotal += lineTotal;

        saleItems.push({
          productId: product._id,
          name: product.name,
          sku: product.sku,
          price: sellingPrice,
          purchasePrice,
          quantity,
          lineTotal,
        });
      }

      const sale = new Sale({
        items: saleItems,
        subtotal,
        total: subtotal,
        paymentMethod,
      });

      await sale.save({ session });
      completedSale = sale;
    });

    res.status(201).json({
      message: "Sale completed successfully!",
      sale: completedSale,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      message: error.message || "Could not complete sale.",
    });
  } finally {
    await session.endSession();
  }
});

export default router;