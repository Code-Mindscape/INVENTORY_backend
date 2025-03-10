import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    workerID: { type: mongoose.Schema.Types.ObjectId, ref: "Worker" },
    productID: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    customerName: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    contact: {
      type: String,
      required: true,
    },
    cod: {
      type: Number,
      required: true,
    },
    description: {
      type: String, // Additional details about the order
      required: true,
    },
    delivered: {
      type: Boolean,
    },
    dateAdded: {
      type: String,
      default: function () {
        return new Date().toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
      },
    },
  },
  { timestamps: true }
);

export const Order = mongoose.model("Order", orderSchema);
