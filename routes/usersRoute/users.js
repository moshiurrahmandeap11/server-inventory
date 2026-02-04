import bcrypt from "bcryptjs";
import { Router } from "express";
import jwt from "jsonwebtoken";
import { db } from "../../db/db.js";
import verifyToken from "../../middleware/verifyToken.js";

const router = Router();

router.get("/", verifyToken, async (req, res) => {
  try {
    const users = await db
      .collection("users")
      .find({}, { projection: { password: 0 } })
      .toArray();

    res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch users",
    });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // validation
    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Email and Password required" });
    }

    // find user
    const user = await db.collection("users").findOne({ email });

    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid Credintials" });
    }

    // compare password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid password" });
    }

    // create jwt
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role || "user" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    // send as http-only cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      message: "Login Successful",
      token,
    });
  } catch (error) {
    console.error("Login Error", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

router.post("/register", async (req, res) => {
  try {
    const { email, password, fullName } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and Password Required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    const emailLower = email.toLowerCase();

    // check existing
    const existingUser = await db.collection("users").findOne({ email: emailLower });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.collection("users").insertOne({
      email: emailLower,
      password: hashedPassword,
      role: "user",          // SERVER CONTROLLED
      fullName: fullName || "",
      createdAt: new Date(),
    });

    res.status(201).json({
      success: true,
      message: "User Created Successfully",
    });

  } catch (error) {
    console.error("Registration Error", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
});


export default router;
