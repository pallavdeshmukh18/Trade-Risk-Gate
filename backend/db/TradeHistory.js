import mongoose from "mongoose";

const tradeSchema = new mongoose.Schema({
    tradeID: mongoose.Schema.Types.ObjectId,
    userID: String,
    openTransactionID: String,
    closeTransactionID: String,
    buyPrice: Number,
    sellPrice: Number,
    quantity: Number,
    netPnL: Number,
    closingTime: Date
})

const Trade = mongoose.models.trades || mongoose.model("trades", tradeSchema);

const addTrade = async (q)=>{
    try{
        await Trade.insertOne(q);
    }catch(err){
        return {
            err: "MONGO_INSTERTION_ERROR",
            details: err
        }
    }
}

const fetchTrade = async (q) => {
    try{
        const trade = await Trade.find({userID: q.userID}).sort({closingTime: -1}).limit(20);
        console.log(typeof(trade));
        return trade; 
    }catch(err){
        return {
            err: "MONGO_ERROR",
            details: err
        }
    }
}

export {addTrade, fetchTrade};