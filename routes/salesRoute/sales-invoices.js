import { Router } from "express";
import { ObjectId } from "mongodb";
import { db } from "../../db/db.js";

const router = Router();

// get all sales invoices
router.get("/", async(req, res) => {
    try {
        const salesInvoices = await db.collection("sales-invoices").find().toArray();
        res.json({
            success: true,
            message: "Successfully fetched all sales invoices",
            data: salesInvoices,
        });
    } catch (err) {
        console.error("Sales invoices fetched error", err);
        res.status(500).json({
            success: false,
            message: "server error",
        })
    }
});


// get single sales invoices
router.get("/:id", async(req, res) => {
    try {
        const {id} = req.params;
        if(!ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid Sales Invoice ID",
            });
        };

        const saleInvoice = await db.collection("sales-invoices").findOne({_id: new ObjectId(id)})
        res.json({
            success: true,
            message: "Successfully fetched single sale invoice",
            data: saleInvoice,
        });
    } catch (err) {
        console.error("Sale invoice fetching error", err);
        res.status(500).json({
            success: false, 
            message: "server error",
        })
    }
});


// add new invoice
router.post("/", async (req, res) => {
  try {
    const {
      productID,
      productName,
      productPrice,
      productQty,
      discount = 0,
      vat = 0,
      paidAmount = 0,
      salesManager,
      customerName,
      customerPhone,
      customerAddress,
    } = req.body;

    // 🔹 Basic Validation
    if (!productID || !productName || !productPrice || !productQty) {
      return res.status(400).json({
        success: false,
        message: "Required fields missing",
      });
    }

    const qty = Number(productQty);
    const price = Number(productPrice);

    if (qty <= 0 || price <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid quantity or price",
      });
    }

    // 🔹 Check product exists
    const product = await db.collection("products").findOne({
      _id: new ObjectId(productID),
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    if (product.quantity < qty) {
      return res.status(400).json({
        success: false,
        message: "Not enough stock available",
      });
    }

    // 🔹 Calculation
    const subtotal = price * qty;
    const discountAmount = Number(discount);
    const vatAmount = (subtotal - discountAmount) * (Number(vat) / 100);
    const grandTotal = subtotal - discountAmount + vatAmount;
    const due = grandTotal - Number(paidAmount);

    // 🔹 Auto Invoice Number
    const invoiceNumber = `INV-${Date.now()}`;

    // 🔹 Save Invoice
    const newInvoice = await db.collection("sales-invoices").insertOne({
      invoiceNumber,
      productID,
      productName,
      productPrice: price,
      productQty: qty,
      subtotal,
      discount: discountAmount,
      vatPercent: vat,
      vatAmount,
      grandTotal,
      paidAmount: Number(paidAmount),
      due,
      customerName: customerName || "",
      customerPhone: customerPhone || "",
      customerAddress: customerAddress || "",
      salesManager: salesManager || "",
      createdAt: new Date(),
    });

    // 🔹 Reduce Stock
    await db.collection("products").updateOne(
      { _id: new ObjectId(productID) },
      { $inc: { quantity: -qty } }
    );

    res.json({
      success: true,
      message: "Invoice created successfully",
      data: {
        invoiceId: newInvoice.insertedId,
        invoiceNumber,
        grandTotal,
        due,
      },
    });
  } catch (err) {
    console.error("Invoice create error", err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
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

    const existingInvoice = await db
      .collection("sales-invoices")
      .findOne({ _id: new ObjectId(id) });

    if (!existingInvoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    const {
      productQty,
      productPrice,
      discount = 0,
      vat = 0,
      paidAmount = 0,
    } = req.body;

    const newQty = Number(productQty);
    const newPrice = Number(productPrice);

    const oldQty = existingInvoice.productQty;

    // 🔥 Stock adjust logic
    const qtyDifference = newQty - oldQty;

    await db.collection("products").updateOne(
      { _id: new ObjectId(existingInvoice.productID) },
      { $inc: { quantity: -qtyDifference } }
    );

    // 🔹 Recalculate
    const subtotal = newQty * newPrice;
    const vatAmount = (subtotal - discount) * (vat / 100);
    const grandTotal = subtotal - discount + vatAmount;
    const due = grandTotal - paidAmount;

    await db.collection("sales-invoices").updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          productQty: newQty,
          productPrice: newPrice,
          subtotal,
          discount,
          vatPercent: vat,
          vatAmount,
          grandTotal,
          paidAmount,
          due,
          updatedAt: new Date(),
        },
      }
    );

    res.json({
      success: true,
      message: "Invoice updated successfully",
    });
  } catch (err) {
    console.error("Invoice update error", err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
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

    const invoice = await db
      .collection("sales-invoices")
      .findOne({ _id: new ObjectId(id) });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    // 🔥 Restore stock
    await db.collection("products").updateOne(
      { _id: new ObjectId(invoice.productID) },
      { $inc: { quantity: invoice.productQty } }
    );

    // 🔥 Delete invoice
    await db
      .collection("sales-invoices")
      .deleteOne({ _id: new ObjectId(id) });

    res.json({
      success: true,
      message: "Invoice deleted & stock restored",
    });
  } catch (err) {
    console.error("Invoice delete error", err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});




export default router;