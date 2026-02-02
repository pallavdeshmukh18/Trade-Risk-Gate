require("dotenv").config()
const express = require("express")
const mongoose = require("mongoose")

const app = express()
const PORT = process.env.PORT || 8000

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("Connection Successfull"))
    .catch(err => console.error("Mongo Error:", err))

app.get("/", (req, res) => {
    res.send("Backend running 🚀")
})

app.listen(PORT, () => {
    console.log(`http://localhost:${PORT}`)
})
