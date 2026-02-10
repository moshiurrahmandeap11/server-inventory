import { Router } from "express";
import { ObjectId } from "mongodb";
import { db } from "../../db/db.js";

const router = Router();

// get all purchases invoices
router.get("/", async(req, res) => {
    try {
        const purchasesInvoices = await db.collection("purchases-invoices").find().toArray();
        res.json({
            success: true,
            message: "Purchases Invoices fetched Successfully",
            data: purchasesInvoices,
        });
    } catch (err) {
        console.error("Purchases Invoices fetching error", err);
        res.status(500).json({
            success: false,
            message: "server error",
        });
    }
});


// purchases invoice get by ID
router.get("/:id", async(req, res) =>{
    try {
        const {id} = req.params;
        if(!ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid Purchase Invoice ID",
            });
        }

        const purchaseInvoice = await db.collection("purchases-invoices").findOne({
            _id: new ObjectId(id)
        });
        res.json({
            success: true,
            message: "Invoice get by ID fetched Successfully",
            data: purchaseInvoice,
        });
    } catch (err) {
        console.error("Invoice fetching error", err);
        res.status(500).json({
            success: false, 
            message: "server error",
        });
    }
});



// add new invoice
router.post("/", async (req, res) => {
    try {
        const {
            productName,
            productID,
            productCategory,
            costPrice,
            supplierName,
            supplierPhone,
            supplierAddress,
            productQTY,
            purchaseDiscount = 0,
            vat = 0,
            paidAmount = 0,
            purchaseManager,
        } = req.body;

        // Basic validation
        if (!productName?.trim())
            return res.status(400).json({ success: false, message: "Product name required" });

        if (!productID?.trim())
            return res.status(400).json({ success: false, message: "Product ID required" });

        if (!supplierName?.trim())
            return res.status(400).json({ success: false, message: "Supplier name required" });

        if (!costPrice || !productQTY)
            return res.status(400).json({ success: false, message: "Cost price & quantity required" });

        const numericCost = Number(costPrice);
        const numericQty = Number(productQTY);
        const numericDiscount = Number(purchaseDiscount);
        const numericVat = Number(vat);
        const numericPaid = Number(paidAmount);

        const subTotal = numericCost * numericQty;
        const total = subTotal - numericDiscount + numericVat;
        const due = total - numericPaid;

        const newInvoice = await db.collection("purchases-invoices").insertOne({
            productName,
            productID,
            productCategory,
            costPrice: numericCost,
            productQTY: numericQty,
            supplierName,
            supplierPhone,
            supplierAddress,
            purchaseDiscount: numericDiscount,
            vat: numericVat,
            subTotal,
            total,
            paidAmount: numericPaid,
            due,
            purchaseManager: purchaseManager || "",
            createdAt: new Date(),
        });

        res.json({
            success: true,
            message: "Purchase invoice created successfully",
            data: newInvoice,
        });

    } catch (err) {
        console.error("Purchase invoice add error", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
});



// update invoice
router.put("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid Invoice ID",
            });
        }

        const {
            costPrice,
            productQTY,
            purchaseDiscount = 0,
            vat = 0,
            paidAmount = 0,
        } = req.body;

        const numericCost = Number(costPrice);
        const numericQty = Number(productQTY);
        const numericDiscount = Number(purchaseDiscount);
        const numericVat = Number(vat);
        const numericPaid = Number(paidAmount);

        const subTotal = numericCost * numericQty;
        const total = subTotal - numericDiscount + numericVat;
        const due = total - numericPaid;

        const updatedInvoice = await db.collection("purchases-invoices").updateOne(
            { _id: new ObjectId(id) },
            {
                $set: {
                    ...req.body,
                    costPrice: numericCost,
                    productQTY: numericQty,
                    purchaseDiscount: numericDiscount,
                    vat: numericVat,
                    subTotal,
                    total,
                    paidAmount: numericPaid,
                    due,
                    updatedAt: new Date(),
                },
            }
        );

        res.json({
            success: true,
            message: "Invoice updated successfully",
            data: updatedInvoice,
        });

    } catch (err) {
        console.error("Invoice update error", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
});


// delete invoice
router.delete("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid Invoice ID",
            });
        }

        const deletedInvoice = await db.collection("purchases-invoices").deleteOne({
            _id: new ObjectId(id),
        });

        if (deletedInvoice.deletedCount === 0) {
            return res.status(404).json({
                success: false,
                message: "Invoice not found",
            });
        }

        res.json({
            success: true,
            message: "Invoice deleted successfully",
        });

    } catch (err) {
        console.error("Invoice delete error", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
});




export default router;