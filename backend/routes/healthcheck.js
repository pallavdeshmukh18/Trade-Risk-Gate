import express from "express";

const router = express.Router();

router.get("/healthcheck", (req, res)=>{
    return res.status(200).json({
        status : "Server running."
    });
});

export default router;