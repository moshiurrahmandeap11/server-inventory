import bcrypt from "bcryptjs";
import { Router } from "express";
import fs from "fs";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";
import path from "path";
import { fileURLToPath } from "url";
import { db } from "../../db/db.js";
import upload from "../../middleware/upload.js";
import verifyToken from "../../middleware/verifyToken.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);



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
      user: {
        _id: user._id,
      },
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
    const existingUser = await db
      .collection("users")
      .findOne({ email: emailLower });

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
      role: "user", // SERVER CONTROLLED
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

// logout
router.post("/logout", (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
    });

    res.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      success: false,
      message: "Logout failed",
    });
  }
});


// get user by Id
router.get("/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    // check valid mongo ID
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid User ID",
      });
    }

    const user = await db
      .collection("users")
      .findOne({ _id: new ObjectId(id) }, { projection: { password: 0 } });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Get User error", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
});

router.patch("/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { password, fullName, status, role } = req.body;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    const updateDoc = {};

    if (fullName) {
      updateDoc.fullName = fullName;
    }

    if (password) {
      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: "Password must be at least 6 characters",
        });
      }
      updateDoc.password = await bcrypt.hash(password, 10);
    }

    // role update
    if(role){
      if(req.user.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Only Admin can change role"
        });
      };
      const allowedRoles = ["admin", "manager", "user"];
      if(!allowedRoles.includes(role)) {
        return res.status(400).json({
          success: false,
          message: "Invalid Role"
        });
      }

      updateDoc.role = role;
    };


    // status update
    if(status){
      if(req.user.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Only Admin can change status"
        });
      }

      const allowedStatus = ["active", "inactive", "suspended"];
      if(!allowedStatus.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid Status value",
        });
      }

      updateDoc.status = status;

    }

    const result = await db
      .collection("users")
      .updateOne({ _id: new ObjectId(id) }, { $set: updateDoc });

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "user not found",
      });
    }

    res.json({
      success: true,
      message: "User update successfully",
    });
  } catch (error) {
    console.error("Update user error", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
});

router.patch("/:id/avatar", verifyToken, upload.single("avatar"), async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id))
      return res.status(400).json({ success: false, message: "Invalid user ID" });

    if (!req.file)
      return res.status(400).json({ success: false, message: "No image uploaded" });

    // New image path for DB
    const imagePath = `/uploads/images/${req.file.filename}`;


    // Find user first
    const user = await db.collection("users").findOne({ _id: new ObjectId(id) });

    //  Delete old avatar safely
    if (user?.avatar) {
      const oldImageFullPath = path.join(process.cwd(), user.avatar);

      if (fs.existsSync(oldImageFullPath)) {
        fs.unlinkSync(oldImageFullPath);
      }
    }

    // Save new avatar path
    await db.collection("users").updateOne(
      { _id: new ObjectId(id) },
      { $set: { avatar: imagePath } }
    );

    res.json({
      success: true,
      message: "Profile Image Updated",
      avatar: imagePath,
    });

  } catch (error) {
    console.error("Profile image error:", error);
    res.status(500).json({ success: false, message: "Upload failed" });
  }
});



// delete user
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid User ID",
      });
    }

    const result = await db.collection("users").deleteOne({
      _id: new ObjectId(id),
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      message: "User deleted Successfully",
    });
  } catch (error) {
    console.error("Delete user error", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

export default router;
