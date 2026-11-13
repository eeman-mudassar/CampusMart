
import bcrypt from "bcryptjs";
import Admin from "../models/Admin.js";

export async function ensureAdmin() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "ADMIN_EMAIL and ADMIN_PASSWORD must be configured in .env"
    );
  }

  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error(
      "JWT_SECRET must be configured with a strong secret of at least 32 characters"
    );
  }

  const existingAdmin = await Admin.findOne({ email });

  if (existingAdmin) {
    console.log("CampusMart admin account already exists.");
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  await Admin.create({
    email,
    password: hashedPassword,
    role: "admin",
  });

  console.log("CampusMart admin account created successfully.");
}
