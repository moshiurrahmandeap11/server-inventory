import { Router } from "express";
import { ObjectId } from "mongodb";
import { db } from "../../db/db.js";

const router = Router();


// get all expense invoices
router.get("/", async(req, res) => {
    try {
        const result = await db.collection("expense-invoices").find().toArray();
        res.json({
            success: true,
            message: "successfully fetched expense invoices",
            data: result,
        });
    } catch (err) {
        console.error("expense invoices fetching error", err);
        res.status(500).json({
            success: false,
            message: "server error",
        })
    }
})


// get single expense invoice
router.get("/:id", async(req, res) => {
    try {
        const {id} = req.params;
        if(!ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false, 
                message: "Invalid expense invoice ID",
            });
        };

        const result = await db.collection("expense-invoices").findOne({_id: new ObjectId(id)})
        res.json({
            success: true,
            message: "single expense invoice fetched successfully",
            data: result,
        });
        
    } catch (err) {
        console.error("single expense fetching error", err);
        res.status(500).json({
            success: false, 
            message:" server error "
        })
    }
})




export default router;