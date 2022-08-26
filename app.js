//jshint esversion:6
require('dotenv').config();
const express = require("express");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');

const app = express();

app.use(express.static("public"));
app.use(express.urlencoded({extended: true}));
app.set('view engine', 'ejs');


app.use(session({
    secret: process.env.SECRET, // Put in a n environment variable
    resave: false,
    saveUninitialized: false
}));


app.use(passport.initialize());
app.use(passport.session());


mongoose.connect("mongodb://localhost:27017/userDB", {useNewUrlParser: true});

const userSchema = new mongoose.Schema({
    email: String,
    password: String
});

userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/", (req,res)=>{res.render("home")});
app.get("/login", (req,res)=>{res.render("login")});
app.get("/register", (req,res)=>{res.render("register")});


app.get('/secrets',function(req,res){
    res.set(
        'Cache-Control',
        'no-cache, private, no-store, must-revalidate, max stal e=0, post-check=0, precheck=0'
    );

    if (req.isAuthenticated()){
        res.render("secrets");
    } else {
        res.redirect("login")
    }
})


app.get("/logout",function(req,res){
    req.logout(function(err){
        if (err) {return next(err); }
        res.redirect('/');
    });
});

app.post("/register",function(req,res){

    User.register({username: req.body.username}, req.body.password, function(err,user){
        if (err){
            console.log(err);
            res.redirect("/register");

        } else {
            passport.authenticate('local')(req,res,function(){
                res.redirect("/secrets");
            });
        }
    });
});

app.post("/login",passport.authenticate("local"), function(req,res){
    const user = new User({
        username: req.body.username,
        password: req.body.password
    });

    req.login(user, function(err){
        if (err) {
            console.log(err);
        } else {
            res.redirect("/secrets");
        }
    });

});


app.listen(3000,()=>{console.log("Server started at port 3000")});
