var express = require("express");
var bodyParser = require("body-parser");
var mongoose = require("mongoose");
var MONGODB_URI = process.env.MONGODB_URI
var app = express();

//Requiring handelbars
var exphbs = require("express-handlebars");

app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

// Require all models
var db = require("./models");

var PORT = 3000;

// Requiring our routes
require("./routes/html-routes.js")(app);
require("./routes/api-routes.js")(app);

// Configure middleware

// Use body-parser for handling form submissions
app.use(bodyParser.urlencoded({ extended: false }));
// Use express.static to serve the public folder as a static directory
app.use(express.static("public"));

// Set mongoose to leverage built in JavaScript ES6 Promises
// Connect to the Mongo DB
mongoose.Promise = Promise;
mongoose.connect( MONGODB_URI || "mongodb://localhost/mongoHeadlinesAP", {
  useMongoClient: true
});

// Start the server
app.listen(PORT, function() {
  console.log("App running on port " + PORT + "!");
});