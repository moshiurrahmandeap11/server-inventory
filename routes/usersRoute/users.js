import { Router } from "express";
import { db } from "../../db/db.js";

const router = Router();

router.get("/", async(req, res) => {
    try{
        const users = await db.collection("users").find().toArray();
        res.json({
            success: true,
            data: users,
        });
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({
            success: false,
            error: "Failed to fetch users"
        })
    }
})

export default router;