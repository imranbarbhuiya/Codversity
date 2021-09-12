// requiring dependencies
import flash from "connect-flash";
import connect_mongo from "connect-mongo";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import express from "express";
import session from "express-session";
import mongoose from "mongoose";
import passport from "passport";
import auth from "./auth/auth.js";
// local modules
import userModel from "./model/userModel.js";
import courseRoute from "./routes/course.js";
import loginRoute from "./routes/login.js";
// object destruction
dotenv.config();
const { create } = connect_mongo;
const { connect } = mongoose;
// initiate app
const app = express();

app
  // set static files
  .use(express.static("public"))
  // set view engine
  .set("view engine", "ejs")
  // fetch data from request
  .use(
    express.urlencoded({
      extended: false,
    })
  )
  .set("trust proxy", 1)
  // set cookie parser
  .use(cookieParser())
  // set express season
  .use(
    session({
      name: "codversity_session_id",
      secret: process.env.SECRET,
      resave: false,
      saveUninitialized: false,
      store: create({ mongoUrl: process.env.MONGODB_SRV }),
      cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 },
    })
  )
  // set flash
  .use(flash())
  // init passport
  .use(passport.initialize())
  .use(passport.session());

// mongodb connect with mongoose
connect(process.env.MONGODB_SRV, (err) => {
  if (err) console.log(err);
  else console.log("Connected to the database successfully.");
});

// passport setup
passport.use(userModel.createStrategy());

passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(function (id, done) {
  userModel.findById(id, function (err, user) {
    done(err, user);
  });
});

// calling auth function
auth(passport);
app.use("/", loginRoute).use("/course", courseRoute);

// will be removed in future
app.get("/", function (req, res) {
  res.render("index", {
    user: req.user ? req.user : null,
  });
});

// listening to port
const port = process.env.PORT;
app.listen(port, () => {
  console.log(`Server started at port ${port}`);
});
