import { Router } from "express";
import { ObjectId } from "mongodb";
import { db } from "../../db/db.js";

const router = Router();


// get all suppliers
router.get("/", async(req, res) => {
    try{
        const suppliers = await db.collection("suppliers").find().toArray();
res.json({
    success: true,
    message: "Suppliers fetched successfully",
    data: suppliers
});

    } catch (err) {
        console.error("Suppliers data fetched error", err);
        res.status(500).json({
            success: false,
            message: "server error",
        })
    }
});


// get single supplier by ID
router.get("/:id", async(req, res) => {
    try {
        const {id} = req.params;
        if(!ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid user ID",
            });
        };

        const supplier = await db.collection("suppliers").findOne({_id: new ObjectId(id)});

        res.json({
            success: true,
            message: "single suppliers get successfully",
            data: supplier,
        });
    } catch (err) {
        console.error("single supplier fetching error", err);
        res.status(500).json({
            success: false,
            message: "server error",
        });
    };
});


// add new supplier
router.post("/", async(req, res) => {
    try {
        const {fullName , phone , email , address} = req.body;
        if(!fullName?.trim()) {
            return res.status(400).json({
                success: false, 
                message: "Full Name required",
            });
        };

        if(!phone?.trim()) {
            return res.status(400).json({
                success: false,
                message: "Phone number required",
            });
        };

        const formattedPhone = phone.trim();

        const existingCustomer = await db.collection("suppliers").findOne({phone: formattedPhone});

        if(existingCustomer) {
            return res.status(400).json({
                success: false,
                message: "Number already exists",
            });
        };

        const newSupplier = await db.collection("suppliers").insertOne({
            name: fullName.trim(),
            phone: formattedPhone,
address: address?.trim() || "",
email: email?.trim() || "",

            createdAt: new Date(),
        });

        res.json({
            success: true,
            message: "New Supplier added successfully",
            data: {
                _id: newSupplier.insertedId,
                name: fullName.trim(),
                phone: formattedPhone,
            },
        });
    } catch (err) {
        console.error("New supplier added error", err);
        res.status(500).json({
            success: false,
            message: "server error",
        })
    }
});


// edit suppliers data by ID
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, phone, email, address } = req.body;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid supplier ID",
      });
    }

    const updateData = {};

    if (fullName?.trim()) updateData.name = fullName.trim();

    if (phone?.trim()) {
      const formattedPhone = phone.trim();

      // duplicate check (except current supplier)
      const existingSupplier = await db.collection("suppliers").findOne({
        phone: formattedPhone,
        _id: { $ne: new ObjectId(id) },
      });

      if (existingSupplier) {
        return res.status(400).json({
          success: false,
          message: "Phone already used by another supplier",
        });
      }

      updateData.phone = formattedPhone;
    }

    if (address !== undefined)
      updateData.address = address?.trim() || "";

    if (email !== undefined)
      updateData.email = email?.trim() || "";

    updateData.updatedAt = new Date();

    const result = await db.collection("suppliers").updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Supplier not found",
      });
    }

    res.json({
      success: true,
      message: "Supplier updated successfully",
    });

  } catch (err) {
    console.error("Supplier update error", err);
    res.status(500).json({
      success: false,
      message: "server error",
    });
  }
});


// delete suppliers by ID
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid supplier ID",
      });
    }

    const result = await db.collection("suppliers").deleteOne({
      _id: new ObjectId(id),
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Supplier not found",
      });
    }

    res.json({
      success: true,
      message: "Supplier deleted successfully",
    });

  } catch (err) {
    console.error("Supplier delete error", err);
    res.status(500).json({
      success: false,
      message: "server error",
    });
  }
});




export default router;