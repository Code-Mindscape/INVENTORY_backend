import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
    },
    stock:{
      type: Number
    }
    ,
    size: {
      type: String,
      default: false, // If size is available
    },
    color: {
      type: String,
      default: false, // If color options are available
    }
  },
  { timestamps: true }
);

export const Product = mongoose.model("Product", productSchema);
