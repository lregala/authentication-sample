//jshint esversion:6
require('dotenv').config();
const express = require("express");
const ejs = require("ejs");
const mongoose = require("mongoose");
const md5 = require("md5");

const app = express();

app.use(express.static("public"));
app.use(express.urlencoded({extended: true}));
app.set('view engine', 'ejs');

mongoose.connect("mongodb://localhost:27017/userDB", {useNewUrlParser: true});

const userSchema = new mongoose.Schema({
    email: String,
    password: String
});



const User = new mongoose.model("User", userSchema);


app.get("/", (req,res)=>{res.render("home")});
app.get("/login", (req,res)=>{res.render("login")});
app.get("/register", (req,res)=>{res.render("register")});


app.post("/register",function(req,res){
    const newUser = new User({
        email: req.body.username,
        password:  md5(req.body.password)
    });

    newUser.save(function(err){
        if (err){
            console.log(err);
        } else {
            res.render("secrets");
        }
    });
});

app.post("/login",function(req,res){
    const username = req.body.username;
    const password = md5(req.body.password);

    User.findOne({email: username}, function(err,foundUser){
        if(err){
            console.log(err);
        } else {
            if (foundUser){
                if (foundUser.password === password) {
                    res.render("secrets");
                }
            }
        }
    });
});

app.listen(3000,()=>{console.log("Server started at port 3000")});