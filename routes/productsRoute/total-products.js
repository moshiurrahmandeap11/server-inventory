import { Router } from "express";
import fs from "fs";
import { ObjectId } from "mongodb";
import path from "path";
import { db } from "../../db/db.js";
import upload from "../../middleware/upload.js";

const router = Router();

// total products get 
router.get("/", async(req, res) => {
    try {
        const totalProducts = await db.collection("products").find().toArray();
        res.json({
            success: true,
            message: "Total products fetched successfully",
            data: totalProducts,
        });
    } catch (error) {
        console.error("Total Products fetched error", error);
        res.status(500).json({
            success: false,
            message: "server error",
        });
    }
});


// products get by id
router.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid Product ID",
            });
        }

        const product = await db
            .collection("products")
            .findOne({ _id: new ObjectId(id) });

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }

        res.json({
            success: true,
            message: "Fetched product data by ID",
            data: product,
        });

    } catch (error) {
        console.error("Products get by ID error", error);
        res.status(500).json({
            success: false,
            message: "server error",
        });
    }
});



// products post 
router.post("/", upload.single("image"), async (req, res) => {
  try {
    const {
      name,
      category,
      description,
    } = req.body;

    if (
      !name ||
      !category
    ) {
      return res.status(400).json({
        success: false,
        message: "Required fields missing",
      });
    }
    const imagePath = req.file
        ? `/uploads/images/${req.file.filename}`
        : null;

    const result = await db.collection("products").insertOne({
      name,
      category,
      description: description || "",
      image: imagePath,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    res.status(201).json({
      success: true,
      message: "Product added successfully",
      data: result,
    });

  } catch (error) {
    console.error("Product add error", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// products update
router.patch(
  "/:id",
  upload.single("image"),
  async (req, res) => {
    try {
      const { id } = req.params;

      if (!ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid Product ID",
        });
      }

      const existing = await db
        .collection("products")
        .findOne({ _id: new ObjectId(id) });

      if (!existing) {
        return res.status(404).json({
          success: false,
          message: "Product not found",
        });
      }

      const updateData = {
        updatedAt: new Date(),
      };

      const fields = [
        "name",
        "category",
        "price",
        "costPrice",
        "quantity",
        "supplier",
        "description",
      ];

      fields.forEach((field) => {
        if (req.body[field] !== undefined) {
          updateData[field] =
            field === "price" ||
            field === "costPrice" ||
            field === "quantity"
              ? Number(req.body[field])
              : req.body[field];
        }
      });

      // Recalculate profit if needed
      if (updateData.price !== undefined || updateData.costPrice !== undefined) {
        const newPrice = updateData.price ?? existing.price;
        const newCost = updateData.costPrice ?? existing.costPrice;
        updateData.profit = newPrice - newCost;
      }

      // ===== IMAGE HANDLE =====
      if (req.file) {
        const newImagePath = `/uploads/images/${req.file.filename}`;
        updateData.image = newImagePath;

        // delete old image
        if (existing.image) {
          const oldImageFullPath = path.join(process.cwd(), existing.image);
          if (fs.existsSync(oldImageFullPath)) {
            fs.unlinkSync(oldImageFullPath);
          }
        }
      }

      await db.collection("products").updateOne(
        { _id: new ObjectId(id) },
        { $set: updateData }
      );

      res.json({
        success: true,
        message: "Product updated successfully",
      });

    } catch (error) {
      console.error("Product update error", error);
      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  }
);

// products delete
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Product ID",
      });
    }

    const existing = await db
      .collection("products")
      .findOne({ _id: new ObjectId(id) });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // delete image
    if (existing.image) {
      const imagePath = path.join(process.cwd(), existing.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await db.collection("products").deleteOne({
      _id: new ObjectId(id),
    });

    res.json({
      success: true,
      message: "Product deleted successfully",
    });

  } catch (error) {
    console.error("Product delete error", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});





export default router;