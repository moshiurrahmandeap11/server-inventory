import { Router } from "express";
import { ObjectId } from "mongodb";
import { db } from "../../db/db.js";

const router = Router();

// get all customers
router.get("/", async (req, res) => {
  try {
    const customers = await db.collection("customers").find().toArray();
    res.json({
      success: true,
      message: "All customers data fetched",
      data: customers,
    });
  } catch (err) {
    console.error("Customers fetched error", err);
    res.status(500).json({
      success: false,
      message: "server error",
    });
  }
});

// single customers data get by id
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid User ID",
      });
    }

    const customer = await db.collection("customers").findOne({
      _id: new ObjectId(id),
    });

    res.json({
      success: true,
      message: "Single Customer fetched successfully",
      data: customer,
    });
  } catch (err) {
    console.error("Single Customer fetching error", err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// add new customer via post method
router.post("/", async (req, res) => {
  try {
    const { fullName, phone, address, email } = req.body;

    if (!fullName?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Full Name Required",
      });
    }

    if (!phone?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Phone number Required",
      });
    }

    const formattedPhone = phone.trim();

    const existingCustomer = await db
      .collection("customers")
      .findOne({ phone: formattedPhone });

    if (existingCustomer) {
      return res.status(400).json({
        success: false,
        message: "Customer already exists",
      });
    }

    const newCustomer = await db.collection("customers").insertOne({
      name: fullName.trim(),
      phone: formattedPhone,
      address: address?.trim() || "",
      email: email?.trim() || "",
      createdAt: new Date(),
    });

    res.json({
      success: true,
      message: "Customer Added successfully",
      data: {
        _id: newCustomer.insertedId,
        name: fullName.trim(),
        phone: formattedPhone,
      },
    });
  } catch (err) {
    console.error("Customer add error", err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});


// update customer
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, phone, address, email } = req.body;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer ID",
      });
    }

    const updateData = {};

    if (fullName) updateData.name = fullName.trim();
    if (phone) updateData.phone = phone.trim();
    if (address !== undefined) updateData.address = address.trim();
    if (email !== undefined) updateData.email = email.trim();

    updateData.updatedAt = new Date();

    const result = await db.collection("customers").updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    res.json({
      success: true,
      message: "Customer updated successfully",
    });

  } catch (err) {
    console.error("Customer update error", err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});


// delete customers
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer ID",
      });
    }

    const result = await db.collection("customers").deleteOne({
      _id: new ObjectId(id),
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    res.json({
      success: true,
      message: "Customer deleted successfully",
    });

  } catch (err) {
    console.error("Customer delete error", err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});




export default router;
