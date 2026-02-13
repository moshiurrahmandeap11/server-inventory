import { Router } from "express";
import { ObjectId } from "mongodb";
import { db } from "../../db/db.js";

const router = Router();

// get all expenses
router.get("/", async(req, res) => {
    try {
        const result = await db.collection("expenses").find().toArray();
        res.json({
            success: true,
            message: "all expenses fetched successfully",
            data: result,
        });
    } catch (err) {
        console.error("all expense fetching error", err);
        res.status(500).json({
            success: false, 
            message: "server error",
        });
    };
})

// get single expenses
router.get("/:id", async(req, res) => {
    try {
        const{id} = req.params;

        if(!ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid Expense ID",
            });
        };

        const result = await db.collection("expenses").findOne({_id: new ObjectId(id)});

        res.json({
            success: true,
            message: "Successfully fetching single expenses",
            data: result,
        });
    } catch (err) {
        console.error("Single expense fetching error", err);
        res.status(500).json({
            success: false, 
            message: "server error",
        })
    }
})

// add new expense - FIXED VERSION
router.post("/", async(req, res) => {
    try {
        const { 
            expenseName, 
            expenseCategory, 
            expenseCost,
            paymentMethod,    // ✅ Added missing field
            status,           // ✅ Added missing field
            description 
        } = req.body;

        // Validation
        if(!expenseName || !expenseCategory || !expenseCost || !paymentMethod) {
            return res.status(400).json({
                success: false, 
                message: "Please fill all required fields",
            });
        }

        if (isNaN(expenseCost) || Number(expenseCost) <= 0) {
            return res.status(400).json({
                success: false,
                message: "Expense cost must be a valid number",
            });
        }

        const addNewExpense = await db.collection("expenses").insertOne({
            expenseName,
            expenseCategory,
            expenseCost: Number(expenseCost),
            paymentMethod,     // ✅ Now included
            status: status || "paid",  // ✅ Now included with default
            description: description || "",
            createdAt: new Date(),
            updatedAt: new Date()
        });

        res.json({
            success: true,
            message: "Successfully added new expense",
            data: {
                _id: addNewExpense.insertedId,
                expenseName,
                expenseCategory,
                expenseCost: Number(expenseCost),
                paymentMethod,
                status: status || "paid",
                description: description || "",
                createdAt: new Date()
            },
        });
    } catch (err) {
        console.error("New Expense adding error", err);
        res.status(500).json({
            success: false, 
            message: err.message || "Server error",
        });
    }
});

// update expense - FIXED VERSION
router.put("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid Expense ID",
            });
        }

        const { 
            expenseName, 
            expenseCategory, 
            expenseCost,
            paymentMethod, 
            status, 
            description 
        } = req.body;

        const updateData = {
            ...(expenseName && { expenseName }),
            ...(expenseCategory && { expenseCategory }),
            ...(expenseCost && { expenseCost: Number(expenseCost) }),
            ...(paymentMethod && { paymentMethod }),  // ✅ Added
            ...(status && { status }),                 // ✅ Added
            ...(description && { description }),
            updatedAt: new Date(),
        };

        const result = await db.collection("expenses").updateOne(
            { _id: new ObjectId(id), isDeleted: { $ne: true } },
            { $set: updateData }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({
                success: false,
                message: "Expense not found",
            });
        }

        res.json({
            success: true,
            message: "Expense updated successfully",
        });

    } catch (err) {
        console.error("Expense update error", err);
        res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
});

// hard delete expense
router.delete("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid Expense ID",
            });
        }

        const result = await db.collection("expenses").deleteOne({
            _id: new ObjectId(id)
        });

        if (result.deletedCount === 0) {
            return res.status(404).json({
                success: false,
                message: "Expense not found",
            });
        }

        res.json({
            success: true,
            message: "Expense deleted permanently",
        });

    } catch (err) {
        console.error("Expense delete error", err);
        res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
});


export default router;