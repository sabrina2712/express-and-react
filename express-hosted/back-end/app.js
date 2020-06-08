var express = require("express");
var path = require("path");
var logger = require("morgan");

var app = express();

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(express.static(path.join(__dirname, "..", "front-end", "build")));

app.get("/api", (req, res) => {
  res.json({ data: "lots and lots of data" });
});

module.exports = app;
