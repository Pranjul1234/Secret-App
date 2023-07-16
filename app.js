const express = require("express");
const bodyparser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");

const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require("mongoose-findorcreate");


// *************this is for level 2*******************
// const encrpt = require("mongoose-encryption");
//******************this is for level 3******************
// const md5 = require("md5");
// ************this is for lelev 4****************
// const bcrypt = require("bcrypt");
// const saltRounds = 10;





const app = express();

app.set('view engine', 'ejs');

app.use(bodyparser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(session({
    secret: "Our little secret.",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());


mongoose.connect("mongodb://127.0.0.1:27017/userDB");

const userSchema = new mongoose.Schema({
    username: { type: String, unique: true },
    password: String,
    googleId: String,
    secret: String
});

userSchema.plugin(passportLocalMongoose);

userSchema.plugin(findOrCreate);

// ************THIS IS FOR level 2  ENCRYPTION ONLY..IF WE USE ENCRPTION THEN IT IS POSSIBLE TO DECODE IT....*********
// const secret = "ThisIsOurLittleSecret.";
// userSchema.plugin(encrpt, { secret: secret, encryptedFields: ["password"] });


const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());

// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());


passport.serializeUser(function (user, cb) {
    process.nextTick(function () {
        return cb(null, {
            id: user.id,
            username: user.username,
            picture: user.picture
        });
    });
});

passport.deserializeUser(function (user, cb) {
    process.nextTick(function () {
        return cb(null, user);
    });
});


passport.use(new GoogleStrategy({
    clientID: "476758756450-8ra0nccueta55a71k8oi9krtj12i2h4j.apps.googleusercontent.com",

    clientSecret: "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",
    callbackURL: "http://localhost:3000/auth/google/secrets"
},
    function (accessToken, refreshToken, profile, cb) {
        User.findOrCreate({ googleId: profile.id }, function (err, user) {
            return cb(err, user);
        });
    }
));


app.get("/", function (req, res) {
    res.render("home");
});


app.get("/auth/google",
    passport.authenticate('google', { scope: ["profile"] })
);

app.get('/auth/google',
    passport.authenticate('google', { scope: ['profile'] }));

app.get('/auth/google/secrets',
    passport.authenticate('google', { failureRedirect: '/login' }),
    function (req, res) {
        // Successful authentication, redirect home.
        res.redirect('/secrets');
    });


app.get("/login", function (req, res) {
    res.render("login");
});

// app.post("/login", function (req, res) {
//     const user = new User({
//         username: req.body.username,
//         password: req.body.password
//     });

//     req.login(user, function (error) {
//         if (error) {
//             console.log(error);
//             res.redirect("/login");
//         } else {
//             passport.authenticate("local")(req, res, function () {
//                 res.redirect("/secrets");
//             });
//         }
//     });
// });

app.post("/login", function (req, res, next) {
    passport.authenticate("local", function (error, user, info) {
        if (error) {
            console.log(error);
            return next(error);
        }
        if (!user) {
            // Authentication failed, redirect to Home page
            return res.redirect("/");
        }
        req.login(user, function (error) {
            if (error) {
                console.log(error);
                return next(error);
            }
            return res.redirect("/secrets");
        });
    })(req, res, next);
});



app.get("/register", function (req, res) {
    res.render("register");
});

app.post("/register", function (req, res) {
    User.register({ username: req.body.username }, req.body.password)
        .then((user) => {
            passport.authenticate("local")(req, res, () => {
                res.redirect("/secrets");
            });
        })
        .catch((error) => {
            console.log(error);
            res.redirect("/register");
        });
});


app.get("/secrets", function (req, res) {
    User.find({ "secret": { $ne: null } })
        .then((foundUsers) => {
            res.render("secrets", { userWithSecrets: foundUsers });
        })
        .catch((error) => {
            console.log(error);
        });
});


app.get("/logout", function (req, res) {
    req.logout(function (error) {
        if (error) {
            console.log(error);
        }
        res.redirect("/");
    });
});


app.get("/submit", function (req, res) {
    if (req.isAuthenticated()) {
        res.render("submit");
    } else {
        res.redirect("/login");
    }
});

app.post("/submit", function (req, res) {
    const submittedSecret = req.body.secret;

    User.findById(req.user.id)
        .then((foundUser) => {
            if (foundUser) {
                foundUser.secret = submittedSecret;
                return foundUser.save();
            } else {
                throw new Error("User not found");
            }
        })
        .then(() => {
            res.redirect("/secrets");
        })
        .catch((error) => {
            console.log(error);
        });



});



app.listen(3000, function () {
    console.log("server has started on port 3000");
});











// ***********this code is for  till level 4 (hash+salt)***************************
// app.post("/login", function (req, res) {
//     const username = req.body.username;
//     const password = req.body.password;

//     User.findOne({ email: username })
//         .then((foundUser) => {
//             bcrypt.compare(password, foundUser.password)
//                 .then((result) => {
//                     if (result === true) {
//                         res.render("secrets");
//                     }
//                 })
// *************************this code is for level 3 (hash)************
//             // if (foundUser.password === password) {
//             //     res.render("secrets");
//             // }
// *****************till this line level 3***********************************
//         })
//         .catch((error) => {
//             console.log(error);
//         })
// });
// *******************this is for level 4****************************
// app.post("/register", function (req, res) {
//     bcrypt.hash(req.body.password, saltRounds)

//         .then((hash) => {
//             const newUser = new User({
//                 email: req.body.username,
//                 password: hash,
//             });
//             newUser.save();
//             res.render("secrets");
//         })
//         .catch((error) => {
//             console.log(error);
//         });

// });

