import { Router } from "express";
import fs from "fs";
import path from "path";
import { db } from "../../db/db.js";
import isAdmin from "../../middleware/isAdmin.js";
import upload from "../../middleware/upload.js";
import verifyToken from "../../middleware/verifyToken.js";

const router = Router();


// get website settings
router.get("/",verifyToken, isAdmin, async(req, res) => {
    try {
        const settings = await db.collection("basic-settings").findOne();
        res.status(200).json({
            success: true,
            message: "Website settings fetched",
            data: settings,
        });
    } catch (err) {
        console.error("Website settings fetched error", err);
        res.status(500).json({
            success: false,
            message: "Server error",
        });
    };
});


// post ( create settings if not exists)
router.post(
  "/",
  verifyToken,
  isAdmin,
  upload.fields([
    { name: "logo", maxCount: 1 },
    { name: "favicon", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const { websiteName } = req.body;

      const existing = await db.collection("basic-settings").findOne();
      if (existing) {
        return res.status(400).json({
          success: false,
          message: "Setting already exist. use patch to update",
        });
      }

      const logo = req.files?.logo
        ? `/uploads/images/${req.files.logo[0].filename}`
        : null;

      const favicon = req.files?.favicon
        ? `/uploads/images/${req.files.favicon[0].filename}`
        : null;

      const result = await db.collection("basic-settings").insertOne({
        websiteName,
        logo,
        favicon,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      res.status(201).json({
        success: true,
        message: "Setting Created",
        data: result,
      });

    } catch (err) {
      console.error("post website settings error", err);
      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  }
);



router.patch(
  "/",
  verifyToken,
  isAdmin,
  upload.fields([
    { name: "logo", maxCount: 1 },
    { name: "favicon", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const { websiteName } = req.body;

      const existing = await db.collection("basic-settings").findOne();

      const updateData = {};

      if (websiteName) updateData.websiteName = websiteName;

      // ===== LOGO HANDLE =====
      if (req.files?.logo) {
        const newLogoPath = `/uploads/images/${req.files.logo[0].filename}`;
        updateData.logo = newLogoPath;

        // delete old logo
        if (existing?.logo) {
          const oldLogoFullPath = path.join(process.cwd(), existing.logo);
          if (fs.existsSync(oldLogoFullPath)) {
            fs.unlinkSync(oldLogoFullPath);
          }
        }
      }

      // ===== FAVICON HANDLE =====
      if (req.files?.favicon) {
        const newFaviconPath = `/uploads/images/${req.files.favicon[0].filename}`;
        updateData.favicon = newFaviconPath;

        // delete old favicon
        if (existing?.favicon) {
          const oldFaviconFullPath = path.join(process.cwd(), existing.favicon);
          if (fs.existsSync(oldFaviconFullPath)) {
            fs.unlinkSync(oldFaviconFullPath);
          }
        }
      }

      updateData.updatedAt = new Date();

      const result = await db.collection("basic-settings").updateOne(
        {},
        { $set: updateData },
        { upsert: true }
      );

      res.status(200).json({
        success: true,
        message: "Settings updated successfully",
        data: result,
      });

    } catch (err) {
      console.error("Update website setting error:", err);
      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  }
);



// DELETE settings
router.delete("/",verifyToken, isAdmin, async (req, res) => {
    try {
        const existing = await db.collection("basic-settings").findOne();

        if (!existing) {
            return res.status(404).json({
                success: false,
                message: "No settings found to delete",
            });
        }

        await db.collection("basic-settings").deleteOne({});

        res.status(200).json({
            success: true,
            message: "Settings deleted successfully",
        });

    } catch (err) {
        console.error("Delete website setting error:", err);
        res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
});



export default router;
