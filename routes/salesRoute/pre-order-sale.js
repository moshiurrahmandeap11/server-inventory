import { Router } from "express";
import { ObjectId } from "mongodb";
import { db } from "../../db/db.js";

const router = Router();

// get all pre order sale list
router.get("/", async(req, res) => {
    try {
        const result = await db.collection("pre-order-sale").find().toArray();
        res.json({
            success: true,
            message: "pre order sales list fetched successfully",
            data: result,
        });
    } catch (err) {
        console.error("Pre order sale fetching error", err);
        res.status(500).json({
            success: false,
            message: "Server error",
        });
    };
});

// get single pre order sale
router.get("/:id", async(req, res) => {
    try {
        const {id} = req.params;
        if(!ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message:"Invalid pre order sale ID",
            });
        };

        const result = await db.collection("pre-order-sale").findOne({_id: new ObjectId(id)})

        if (!result) {
            return res.status(404).json({
                success: false,
                message: "Pre order sale not found",
            });
        }
        
        res.json({
            success: true, 
            message: "single pre order sale fetched successfully",
            data: result,
        });

    } catch(err) {
        console.error("single pre order sale fetching error", err);
        return res.status(500).json({
            success: false, 
            message: "server error",
        });
    };
});

// FIXED: add new pre order sale
router.post("/", async(req,res) => {
    try {
        const { 
            productID, 
            productName, 
            productCategory, 
            productPrice,
            discount,
            productQTY,        
            totalAmount, 
            paidAmount, 
            dueAmount, 
            customerName, 
            customerPhone, 
            customerAddress,
            salesManager,      
            status            
        } = req.body;

        // FIXED: Validation - customerAddress optional kora hoyeche
        if (
            !productID ||
            !productName ||
            !productCategory ||
            !productPrice ||
            !productQTY ||
            !totalAmount ||
            !paidAmount ||
            !dueAmount ||
            !customerName ||
            !customerPhone
            // ✅ customerAddress removed from required fields
        ) {
            // Log the missing fields for debugging
            const missingFields = [];
            if (!productID) missingFields.push('productID');
            if (!productName) missingFields.push('productName');
            if (!productCategory) missingFields.push('productCategory');
            if (!productPrice) missingFields.push('productPrice');
            if (!productQTY) missingFields.push('productQTY');
            if (!totalAmount) missingFields.push('totalAmount');
            if (!paidAmount) missingFields.push('paidAmount');
            if (!dueAmount) missingFields.push('dueAmount');
            if (!customerName) missingFields.push('customerName');
            if (!customerPhone) missingFields.push('customerPhone');
            // ✅ customerAddress not included here
            
            console.log("Missing fields:", missingFields);
            
            return res.status(400).json({
                success: false,
                message: `Required fields missing: ${missingFields.join(', ')}`,
            });
        }

        // FIXED: productPrice parseFloat and validate
        const parsedProductPrice = parseFloat(productPrice);
        if (isNaN(parsedProductPrice) || parsedProductPrice <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid product price",
            });
        }

        const addNewPreOrder = await db.collection("pre-order-sale").insertOne({
            productID,
            productName,
            productCategory,
            productPrice: parsedProductPrice,
            discount: parseFloat(discount) || 0,
            productQTY: parseFloat(productQTY),
            totalAmount: parseFloat(totalAmount),
            paidAmount: parseFloat(paidAmount),
            dueAmount: parseFloat(dueAmount),
            customerName,
            customerPhone,
            customerAddress: customerAddress || "N/A", // ✅ Default value
            salesManager: salesManager || "",
            status: status || "pre-order",
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        res.json({
            success: true,
            message: "successfully added new pre order sale",
            data: {
                _id: addNewPreOrder.insertedId,
                ...req.body,
                productPrice: parsedProductPrice,
                productQTY: parseFloat(productQTY),
                totalAmount: parseFloat(totalAmount),
                paidAmount: parseFloat(paidAmount),
                dueAmount: parseFloat(dueAmount),
                discount: parseFloat(discount) || 0,
                customerAddress: customerAddress || "N/A"
            },
        });
    } catch (err) {
        console.error("new pre order sale error", err);
        res.status(500).json({
            success: false,
            message: err.message || "Server error",
        });
    };
});

// FIXED: Single update route (removed duplicate)
router.patch("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid pre order sale ID",
            });
        }

        const {
            productID,
            productName,
            productCategory,
            productPrice,
            discount,
            productQTY,
            totalAmount,
            paidAmount,
            dueAmount,
            customerName,
            customerPhone,
            customerAddress,
            salesManager,
            status
        } = req.body;

        const updateDoc = {
            ...(productID && { productID }),
            ...(productName && { productName }),
            ...(productCategory && { productCategory }),
            ...(productPrice !== undefined && { productPrice: parseFloat(productPrice) }),
            ...(discount !== undefined && { discount: parseFloat(discount) }),
            ...(productQTY && { productQTY: parseFloat(productQTY) }),
            ...(totalAmount && { totalAmount: parseFloat(totalAmount) }),
            ...(paidAmount !== undefined && { paidAmount: parseFloat(paidAmount) }),
            ...(dueAmount !== undefined && { dueAmount: parseFloat(dueAmount) }),
            ...(customerName && { customerName }),
            ...(customerPhone && { customerPhone }),
            ...(customerAddress && { customerAddress }),
            ...(salesManager && { salesManager }),
            ...(status && { status }),
            updatedAt: new Date(),
        };

        const result = await db.collection("pre-order-sale").updateOne(
            { _id: new ObjectId(id) },
            { $set: updateDoc }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({
                success: false,
                message: "Pre order sale not found",
            });
        }

        res.json({
            success: true,
            message: "Pre order sale updated successfully",
        });

    } catch (err) {
        console.error("Update pre order sale error", err);
        res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
});

// DELETE route (optional - add if needed)
router.delete("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid pre order sale ID",
            });
        }

        const result = await db.collection("pre-order-sale").deleteOne({
            _id: new ObjectId(id)
        });

        if (result.deletedCount === 0) {
            return res.status(404).json({
                success: false,
                message: "Pre order sale not found",
            });
        }

        res.json({
            success: true,
            message: "Pre order sale deleted successfully",
        });

    } catch (err) {
        console.error("Delete pre order sale error", err);
        res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
});

export default router;