var express = require("express");
var app = express();
app.use(express.static("public"));

const { v4: uuidv4 } = require("uuid");

var bodyParser = require("body-parser");
var mongoose = require("mongoose");

var fs = require("fs");
var path = require("path");
require("dotenv/config");


// setting up express-session
var session = require("express-session");
app.use(
  session({
    secret: process.env.SECRET_KEY,
  })
);

// setting up mongoose & data models
let userSchema = new mongoose.Schema(
  {
    _id: String,
    name: String,
    email: String,
    password: String,
  },
  { _id: false }
);
let userRecord = new mongoose.model("userRecord", userSchema, "userRecord");

var imageSchema = new mongoose.Schema({
  name: String,
  desc: [String],
  img: {
    data: Buffer,
    contentType: String,
  },
  userId: { type: mongoose.Schema.Types.String, ref: "userRecord" },
});

var imgModel = new mongoose.model("Image", imageSchema);


mongoose.connect(
  process.env.MONGO_URL,
  { useNewUrlParser: true, useUnifiedTopology: true },
  (err) => {
    console.log("connected");
  }
);

// setting up EJS
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.set("views", "./views");


// multer setup (middleware for image files)
var multer = require("multer");

var storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads");
  },
  filename: (req, file, cb) => {
    cb(null, file.fieldname + "-" + Date.now());
  },
});

var upload = multer({ storage: storage });




// GET:  /
app.get("/", (req, res) => {
  if (req.session && req.session.loggedin) {
    imgModel.find({ userId: req.session.uid }, (err, items) => {
      if (err) {
        console.log(err);
        res.status(500).send("An error occurred", err);
      } else {
        res.render("homePage", {
          items: items,
          user: req.session,
          loginToCont: false,
        });
      }
    });
  } else {
    res.render("homePage", { items: [], user: {}, loginToCont: true });
  }
});

// GET: /addPhoto
app.get("/addPhoto", (req, res) => {
  if (req.session && req.session.loggedin) {
    res.render("addPhoto", { user: req.session });
  } else {
    res.status(401).render("notAuthorised");
  }
});

// POST: /addPhoto
app.post("/addPhoto", upload.single("imageFile"), (req, res, next) => {
  if (req.session && req.session.loggedin) {
    var ts = [];
    if (req.body.tags) {
      ts = req.body.tags[1].split(",");
    }
    var obj = {
      name: req.body.imageTitle,
      desc: ts,
      img: {
        data: fs.readFileSync(
          path.join(__dirname + "/uploads/" + req.file.filename)
        ),
        contentType: "image/png",
      },
      userId: req.session.uid,
    };
    imgModel.create(obj, (err, item) => {
      if (err) {
        console.log(err);
      } else {
        res.redirect("/");
      }
    });
  } else {
    res.status(401).render("notAuthorised");
  }
});


// POST: /tagsSearch
app.post("/tagsSearch", (req, res) => {
  if (req.session && req.session.loggedin) {
    let tag = req.body.tagSearch;
    imgModel.find(
      {
        userId: req.session.uid,
        $where: `this.desc.indexOf("${tag}") != -1`,
      },
      (err, items) => {
        if (err) {
          console.log(err);
          res.status(500).send("An error occurred", err);
        } else {
          res.render("homePage", {
            items: items,
            user: req.session,
            loginToCont: false,
          });
        }
      }
    );
  } else {
    res.status(401).render("notAuthorised");
  }
});

// GET: /register
app.get("/register", (req, res) => {
  res.render("register", { msg: "", user: {} });
});

// POST: /register
app.post("/register", (req, res) => {
  var name = req.body.userName;
  var email = req.body.userEmail;
  var password1 = req.body.userPassword1;
  var password2 = req.body.userPassword2;

  if (name && email && password1 && password2) {
    userRecord
      .find({
        email: email,
      })
      .exec((err, result) => {
        if (err) {
          console.log("Error in finding user in database: " + err);
        } else {
          if (result.length > 0) {
            res.render("register", {
              msg: "Email ID already linked to Registered Account, ",
              login: true,
              user: {},
            });
          } else {
            if (password1 !== password2) {
              res.render("register", {
                msg: "Passwords to Not Match, Try again",
                login: false,
                user: {},
              });
            } else {
              let unique = uuidv4();
              var user = new userRecord({
                _id: unique,
                name: name,
                email: email,
                password: password1,
              });
              user.save((err, result) => {
                if (err) {
                  console.log("Database Error " + err);
                } else {
                  req.session.name = result.name;
                  req.session.email = result.email;
                  req.session.uid = result._id;
                  req.session.loggedin = true;
                  req.session.save((error) => {
                    if (error) {
                      console.log(error);
                    } else {
                      res.redirect("/");
                    }
                  });
                }
              });
            }
          }
        }
      });
  } else {
    res.render("register", {
      msg: "Please complete the Registration Form",
      login: false,
    });
  }
});

// GET: /login
app.get("/login", (req, res) => {
  if (req.query.action && req.query.action === "logout") {
    req.session.destroy((err) => {
      if (err) {
        console.log(err);
      }
    });
    res.redirect("/");
  } else {
    res.render("login", { msg: "", user: {} });
  }
});

// POST: /login
app.post("/login", (req, res) => {
  var email = req.body.userEmail;
  var password = req.body.userPassword;

  if (email && password) {
    userRecord.countDocuments({ email: email }).exec((err, count) => {
      if (err) {
        console.log(err);
      } else {
        if (count <= 0) {
          res.render("login", { msg: "User is not Registered", user: {} });
        } else {
          userRecord
            .find({ email: email, password: password })
            .exec((err, result) => {
              if (err) {
                console.log("Database Error: " + err);
              } else {
                if (result.length > 0) {
                  req.session.name = result[0].name;
                  req.session.email = result[0].email;
                  req.session.uid = result[0]._id;
                  req.session.loggedin = true;
                  req.session.save((err) => {
                    if (err) {
                      console.log("Error in saving session: " + err);
                    } else {
                      res.redirect("/");
                    }
                  });
                } else {
                  res.render("login", {
                    msg: "Incorrect Password, try again",
                    user: {},
                  });
                }
              }
            });
        }
      }
    });
  } else {
    res.render("login", { msg: "Please enter all the details.", user: {} });
  }
});

// 404 route
app.get('*', function(req, res){
  res.status(404).render("404");
});

var port = process.env.PORT || "3000";
app.listen(port, (err) => {
  if (err) throw err;
  console.log("Server listening on port", port);
});
