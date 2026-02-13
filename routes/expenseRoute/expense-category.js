import { Router } from "express";
import { ObjectId } from "mongodb";
import { db } from "../../db/db.js";

const router = Router();

// GET all expense categories
router.get("/", async(req, res) => {
    try {
        const result = await db.collection("expense-category").find().toArray();
        res.json({
            success: true,
            message: "expense categories fetched successfully",
            data: result,
        });
    } catch (err) {
        console.error("expense category fetching error", err);
        res.status(500).json({
            success: false, 
            message: "server error",
        });
    }
});

// GET single expense category
router.get("/:id", async(req, res) => {
    try {
        const {id} = req.params;
        if(!ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false, 
                message: "Invalid expense category ID",
            });
        }
        
        const result = await db.collection("expense-category").findOne({
            _id: new ObjectId(id),
        });

        if (!result) {
            return res.status(404).json({
                success: false,
                message: "Expense category not found",
            });
        }

        res.json({
            success: true, 
            message: "successfully fetched expense category",
            data: result,
        });
    } catch (err) {
        console.error("single expense category fetching error", err);
        res.status(500).json({
            success: false, 
            message: "server error",
        });
    }
});

// ADD new expense category
router.post("/", async(req, res) => {
    try {
        const {categoryName} = req.body;
        
        if(!categoryName || !categoryName.trim()) {
            return res.status(400).json({
                success: false, 
                message: "Category name is required",
            });
        }

        // Check if category already exists
        const existingCategory = await db.collection("expense-category").findOne({
            categoryName: categoryName.trim()
        });

        if (existingCategory) {
            return res.status(400).json({
                success: false,
                message: "Category already exists",
            });
        }

        const newCategory = await db.collection("expense-category").insertOne({
            categoryName: categoryName.trim(),
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        res.json({
            success: true,
            message: "new expense category successfully added",
            data: {
                _id: newCategory.insertedId,
                categoryName: categoryName.trim(),
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        });
    } catch (err) {
        console.error("new expense category adding error", err);
        res.status(500).json({
            success: false, 
            message: "server error",
        });
    }
});

// UPDATE expense category
router.put("/:id", async(req, res) => {
    try {
        const { id } = req.params;
        const { categoryName } = req.body;

        // Validate ID
        if (!ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid expense category ID",
            });
        }

        // Validate input
        if (!categoryName || !categoryName.trim()) {
            return res.status(400).json({
                success: false,
                message: "Category name is required",
            });
        }

        // Check if category exists
        const existingCategory = await db.collection("expense-category").findOne({
            _id: new ObjectId(id),
        });

        if (!existingCategory) {
            return res.status(404).json({
                success: false,
                message: "Expense category not found",
            });
        }

        // Check if another category with same name exists
        const duplicateCategory = await db.collection("expense-category").findOne({
            categoryName: categoryName.trim(),
            _id: { $ne: new ObjectId(id) }
        });

        if (duplicateCategory) {
            return res.status(400).json({
                success: false,
                message: "Another category with this name already exists",
            });
        }

        // Update category
        const result = await db.collection("expense-category").updateOne(
            { _id: new ObjectId(id) },
            { 
                $set: { 
                    categoryName: categoryName.trim(),
                    updatedAt: new Date(),
                } 
            }
        );

        if (result.modifiedCount === 0) {
            return res.status(400).json({
                success: false,
                message: "No changes were made",
            });
        }

        res.json({
            success: true,
            message: "Expense category updated successfully",
        });

    } catch (err) {
        console.error("expense category update error", err);
        res.status(500).json({
            success: false,
            message: "server error",
        });
    }
});

// PATCH - Partial update (alternative to PUT)
router.patch("/:id", async(req, res) => {
    try {
        const { id } = req.params;
        const { categoryName } = req.body;

        // Validate ID
        if (!ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid expense category ID",
            });
        }

        // Check if category exists
        const existingCategory = await db.collection("expense-category").findOne({
            _id: new ObjectId(id),
        });

        if (!existingCategory) {
            return res.status(404).json({
                success: false,
                message: "Expense category not found",
            });
        }

        const updateData = {};
        
        if (categoryName && categoryName.trim()) {
            // Check for duplicate
            const duplicateCategory = await db.collection("expense-category").findOne({
                categoryName: categoryName.trim(),
                _id: { $ne: new ObjectId(id) }
            });

            if (duplicateCategory) {
                return res.status(400).json({
                    success: false,
                    message: "Another category with this name already exists",
                });
            }
            
            updateData.categoryName = categoryName.trim();
        }

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({
                success: false,
                message: "No valid fields to update",
            });
        }

        updateData.updatedAt = new Date();

        // Update category
        const result = await db.collection("expense-category").updateOne(
            { _id: new ObjectId(id) },
            { $set: updateData }
        );

        res.json({
            success: true,
            message: "Expense category updated successfully",
        });

    } catch (err) {
        console.error("expense category patch error", err);
        res.status(500).json({
            success: false,
            message: "server error",
        });
    }
});

// DELETE expense category (soft delete - just in case)
router.delete("/:id", async(req, res) => {
    try {
        const { id } = req.params;

        // Validate ID
        if (!ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid expense category ID",
            });
        }

        // Check if category exists
        const existingCategory = await db.collection("expense-category").findOne({
            _id: new ObjectId(id),
        });

        if (!existingCategory) {
            return res.status(404).json({
                success: false,
                message: "Expense category not found",
            });
        }

        // Check if category is being used in expenses
        const usedInExpenses = await db.collection("expenses").findOne({
            expenseCategory: existingCategory.categoryName
        });

        if (usedInExpenses) {
            // Option 1: Soft delete (recommended)
            await db.collection("expense-category").updateOne(
                { _id: new ObjectId(id) },
                { 
                    $set: { 
                        isDeleted: true,
                        deletedAt: new Date(),
                        updatedAt: new Date(),
                    } 
                }
            );

            return res.json({
                success: true,
                message: "Expense category soft deleted (marked as inactive)",
                softDeleted: true
            });
        }

        // Option 2: Hard delete if not used
        const result = await db.collection("expense-category").deleteOne({
            _id: new ObjectId(id)
        });

        if (result.deletedCount === 0) {
            return res.status(400).json({
                success: false,
                message: "Failed to delete category",
            });
        }

        res.json({
            success: true,
            message: "Expense category deleted successfully",
        });

    } catch (err) {
        console.error("expense category delete error", err);
        res.status(500).json({
            success: false,
            message: "server error",
        });
    }
});

// HARD DELETE - Force delete (use carefully)
router.delete("/:id/hard", async(req, res) => {
    try {
        const { id } = req.params;

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid expense category ID",
            });
        }

        const result = await db.collection("expense-category").deleteOne({
            _id: new ObjectId(id)
        });

        if (result.deletedCount === 0) {
            return res.status(404).json({
                success: false,
                message: "Expense category not found",
            });
        }

        res.json({
            success: true,
            message: "Expense category permanently deleted",
        });

    } catch (err) {
        console.error("expense category hard delete error", err);
        res.status(500).json({
            success: false,
            message: "server error",
        });
    }
});

export default router;