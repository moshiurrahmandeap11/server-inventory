import { Router } from "express";
import { ObjectId } from "mongodb";
import { db } from "../../db/db.js";

const router = Router();

// get all products categories
router.get("/", async (req, res) => {
  try {
    const categories = await db
      .collection("product-categories")
      .find()
      .toArray();
    res.json({
      success: true,
      message: "All Products Categories fetched successfully",
      data: categories,
    });
  } catch (error) {
    console.error("products categories fetched error", error);
    res.status(500).json({
      success: false,
      message: "server error",
    });
  }
});

// get single category by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Category ID",
      });
    }

    const category = await db.collection("product-categories").findOne({
      _id: new ObjectId(id),
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    res.json({
      success: true,
      message: "Fetched single category data by ID",
      data: category,
    });
  } catch (err) {
    console.error("single category fetched error", err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// category post
router.post("/", async (req, res) => {
  try {
    let { name } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Category name required",
      });
    }

    name = name.trim().toLowerCase();

    const existing = await db
      .collection("product-categories")
      .findOne({ name });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Product Category already exists",
      });
    }

    const newCategory = await db.collection("product-categories").insertOne({
      name,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    res.status(201).json({
      success: true,
      message: "New product category added successfully",
      data: newCategory,
    });
  } catch (err) {
    console.error("Category post error", err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// update category
router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Category ID",
      });
    }

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Category name is required",
      });
    }

    // check duplicate (excluding current category)
    const existing = await db.collection("product-categories").findOne({
      name,
      _id: { $ne: new ObjectId(id) },
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Category name already exists",
      });
    }

    const updatedCategory = await db.collection("product-categories").updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          name,
          updatedAt: new Date(),
        },
      },
    );

    if (updatedCategory.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    res.json({
      success: true,
      message: "Category updated successfully",
    });
  } catch (err) {
    console.error("Category update error", err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// delete category
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Category ID",
      });
    }

    const deletedCategory = await db
      .collection("product-categories")
      .deleteOne({
        _id: new ObjectId(id),
      });

    if (deletedCategory.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    res.json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (err) {
    console.error("Category delete error", err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

export default router;
