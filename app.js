const path = require("path");
const express = require("express");
const methodOverride = require("method-override");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const morgan = require("morgan");
const exphbs = require("express-handlebars");
const passport = require("passport");
const session = require("express-session");
const MongoStore = require("connect-mongo")(session);
const connectDB = require("./config/db");
const redirectToHTTPS = require('express-http-to-https').redirectToHTTPS


//load config
dotenv.config({ path: "./config/config.env" });

//passport config
require("./config/passport")(passport);
connectDB();

const app = express();

//Body parser
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

//Method override
app.use(methodOverride(function(req, res){
  if(req.body && typeof req.body === 'object' && '_method' in req.body){
    var method = req.body._method;
    delete req.body._method;
    return method;
  }
}));

 
// Don't redirect if the hostname is `localhost:port` or the route is `/insecure`
app.use(redirectToHTTPS([/localhost:(\d{4})/], [/\/insecure/], 301));

//logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

//handlebars helper
const { formatDate, stripTags, truncate, editIcon, select } = require("./helpers/hbs");

//handlebars
app.engine(
  ".hbs",
  exphbs({
    helpers: {
      formatDate,
      stripTags,
      truncate,
      editIcon,
      select,
    },
    defaultLayout: "main",
    extname: ".hbs",
  })
);
app.set("view engine", ".hbs");

//session
app.use(
  session({
    secret: "keyboard cat",
    resave: false,
    saveUninitialized: true,
    // cookie: { secure: true }
    store: new MongoStore({ mongooseConnection: mongoose.connection }),
  })
);

//passport middleware
app.use(passport.initialize());
app.use(passport.session());

//Set global var
app.use(function(req, res, next){
  res.locals.user = req.user || null;
  next();
});

//static folder
app.use(express.static(path.join(__dirname, "public")));

const PORT = process.env.PORT || 5000;
//routes
app.use("/", require("./routes/index"));
app.use("/auth", require("./routes/auth"));
app.use("/stories", require("./routes/stories"));

app.listen(
  PORT,
  // console.log(`Server running in ${process.env.NODE_ENV} mode in port ${PORT}`)
  console.log(`Server running in port ${PORT}`)
);
