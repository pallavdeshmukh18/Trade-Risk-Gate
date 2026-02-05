import mongoose from "mongoose";

const Order = mongoose.models.positions;

const findOrderData = async (q)=>{
  try{
    const orders = await Order.find({ userID: q.userID }).sort({ transactionTime: -1 }).limit(20);

    return orders;
  }catch(err){
    return {
        error: "MONGO_SEARCH_ERR",
        detials: err
    }
  }
    
};

export default findOrderData;