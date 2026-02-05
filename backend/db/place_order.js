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

const Order = mongoose.models.positions || mongoose.model("positions", orderSchema);

const updateOrderData = async (q)=>{
  try{
    await Order.insertOne(q);
  } catch(err){
    return {
      error: "MONGO_INSERTION_ERR",
      details: err
    }
  }
    
};

export default updateOrderData;