import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const orderSchema = new mongoose.Schema({
  positionID: mongoose.Schema.Types.ObjectId,
  userID: String,
  symbol: String,
  atp: Number,
  side: String,
  quantity: Number,
  transactionTime: Date
});

const Order = mongoose.model("positions", orderSchema);

const updateOrderData = async (q)=>{
    await Order.insertOne(q);
};

export default updateOrderData;