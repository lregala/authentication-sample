//jshint esversion:6
require('dotenv').config();
const express = require("express");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');

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
    password: String,
    googleID: { type: String, require: true, index:true, unique:true,sparse:true},
    secret: Array
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
    done(null, user.id);
});

passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    //console.log(profile);


    User.findOrCreate({ username: profile.id, googleId: profile.id}, function (err, user) {
      return cb(err, user);
    });
  }
));



app.get("/", (req,res)=>{res.render("home")});


app.get("/auth/google",passport.authenticate("google", {scope: ["openid","profile","email"] }));

app.get("/auth/google/secrets",passport.authenticate('google',{failureRedirect: '/login'}),
    function(req,res){
        res.redirect('/secrets');
});

app.get("/login", (req,res)=>{res.render("login")});
app.get("/register", (req,res)=>{res.render("register")});


app.get('/secrets',function(req,res){
    res.set(
        'Cache-Control',
        'no-cache, private, no-store, must-revalidate, max stal e=0, post-check=0, precheck=0'
    );

    if (req.isAuthenticated()){
        User.find({"secret":{$ne:null}}, function(err, foundUsers){
            if (err){
                console.log(err);
            } else {
                if (foundUsers) {
                    res.render("secrets", {usersWithSecrets: foundUsers});
                }
            }
        });


    } else {
        res.redirect("login")
    }
})


app.get("/submit", function(req,res){
    if (req.isAuthenticated()){
        res.render("submit");
    } else {
        res.redirect("login")
    }
});

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

app.post("/login",passport.authenticate("local",{ failureRedirect: "/login" }), function(req,res){
    const user = new User({
        username: req.body.username,
        password: req.body.password
    });
    
    passport.authenticate('local')(req,res,function(){
        res.redirect("/secrets");
    });

});


app.post("/submit",function(req,res){
    const submittedSecret = req.body.secret;

    console.log(req.user.id);

    User.findById(req.user.id,function(err, foundUser){
        if (err) {
            console.log(err);
        } else {
            if (foundUser) {
                foundUser.secret.push(submittedSecret);
                foundUser.save(function(){
                    res.redirect("/secrets");
                });
            }
        }
    })
});

app.listen(3000,()=>{console.log("Server started at port 3000")});
