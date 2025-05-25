const express = require("express");
const router = express.Router();

router.get("/" , async(req,res)=>{
    res.render("index");
})

router.get("/choose" , async(req,res)=>{
    res.render("choose");
})
router.get("/Cv1/new" , async(req,res)=>{
    res.render("newCv1");
})
router.get("/Cv2/new" , async(req,res)=>{
    res.render("newCv2");
})
router.post("/Cv1",async(req,res)=>{
    let {user}= req.body;
    res.render("cv1",{user});
})
router.post("/Cv2",async(req,res)=>{
    let {user}= req.body;
    res.render("cv2",{user});
})

router.get("/get_score", (req,res)=>{
res.render("score");
})

module.exports = router; 