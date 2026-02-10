import { Router } from "express";
import { ObjectId } from "mongodb";
import { db } from "../../db/db.js";

const router = Router();

// get all sales items
router.get("/", async(req, res) => {
    try {
        const salesItems = await db.collection("sales-items").find().toArray();
        res.json({
            success: true,
            message: "Sales Items fetched successfully",
            data: salesItems,
        });
    } catch (err) {
        console.error("Sales items fetched error", err);
        res.status(500).json({
            success: false,
            message: "server error"
        })
    }
});


// get single sale item by ID
router.get("/:id", async(req, res) => {
    try {
        const {id} = req.params;
        if(!ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false, 
                message: "Invalid user ID",
            });
        };

        const saleItem = await db.collection("sales-items").findOne({_id: new ObjectId(id)})
        res.json({
            success: true,
            message: "Single sale Item fetched",
            data: saleItem,
        });
    } catch (err) {
        console.error("Sale item fetched error", err);
        res.status(500).json({
            success: false,
            message: "server error",
        });
    };
});
/* ===========================
   ADD NEW SALE
=========================== */

router.post("/", async (req, res) => {
  try {
    const {
      customerName,
      customerPhone,
      customerAddress,
      items,
      vat = 0,
      tax = 0,
      discount = 0,
      paidAmount = 0,
      salesManager,
      productID,
      productName,
      productPrice,
      productQty,

    } = req.body;

    if (!customerName?.trim())
      return res.status(400).json({ success: false, message: "Customer name required" });

    if (!customerPhone?.trim())
      return res.status(400).json({ success: false, message: "Customer phone required" });

    if (!Array.isArray(items) || items.length === 0)
      return res.status(400).json({ success: false, message: "Sale items required" });

    let subTotal = 0;

    // 🔥 stock check + calculate
    for (let item of items) {
      const product = await db.collection("products").findOne({
        _id: new ObjectId(item.productId),
      });

      if (!product || product.quantity < item.qty) {
        return res.status(400).json({
          success: false,
          message: `Not enough stock for ${item.productName}`,
        });
      }

      const itemSub = item.qty * item.price;
      item.subtotal = itemSub;
      item.total = itemSub - (item.discount || 0);

      subTotal += item.total;

      // reduce stock
      await db.collection("products").updateOne(
        { _id: new ObjectId(item.productId) },
        { $inc: { quantity: -item.qty } }
      );
    }

    const grandTotal =
      subTotal +
      (subTotal * vat) / 100 +
      (subTotal * tax) / 100 -
      discount;

    const due = grandTotal - paid;

    const newSale = await db.collection("sales-items").insertOne({
      customer: {
        name: customerName.trim(),
        phone: customerPhone.trim(),
        address: customerAddress || "",
      },
      productID,
      productName,
      productPrice,
      productQty,
      subTotal,
      vat,
      tax,
      discount,
      grandTotal,
      paidAmount,
      due,
      salesManager: salesManager || "",
      createdAt: new Date(),
    });

    res.json({
      success: true,
      message: "Sale created successfully",
      data: newSale,
    });
  } catch (err) {
    console.error("Add sale error", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/* ===========================
   UPDATE SALE
=========================== */

router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id))
      return res.status(400).json({ success: false, message: "Invalid Sale ID" });

    const existingSale = await db.collection("sales").findOne({
      _id: new ObjectId(id),
    });

    if (!existingSale)
      return res.status(404).json({ success: false, message: "Sale not found" });

    const {
      customerName,
      customerPhone,
      customerAddress,
      paid,
    } = req.body;

    const updatedDoc = {
      ...(customerName && { "customer.name": customerName }),
      ...(customerPhone && { "customer.phone": customerPhone }),
      ...(customerAddress && { "customer.address": customerAddress }),
      ...(paid !== undefined && { paid }),
      updatedAt: new Date(),
    };

    // recalc due if paid updated
    if (paid !== undefined) {
      updatedDoc.due = existingSale.grandTotal - paid;
    }

    await db.collection("sales-items").updateOne(
      { _id: new ObjectId(id) },
      { $set: updatedDoc }
    );

    res.json({
      success: true,
      message: "Sale updated successfully",
    });
  } catch (err) {
    console.error("Update sale error", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/* ===========================
   DELETE SALE
=========================== */

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    console.log("id", id);

    if (!ObjectId.isValid(id))
      return res.status(400).json({ success: false, message: "Invalid Sale ID" });

    const sale = await db.collection("sales-items").findOne({
      _id: new ObjectId(id),
    });

    if (!sale)
      return res.status(404).json({ success: false, message: "Sale not found" });

    await db.collection("sales-items").deleteOne({
      _id: new ObjectId(id),
    });

    res.json({
      success: true,
      message: "Sale deleted & stock restored",
    });
  } catch (err) {
    console.error("Delete sale error", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});


export default router;