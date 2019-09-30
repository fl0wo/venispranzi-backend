const express = require("express");

var port = process.env.PORT || 3000;

var app = express();

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");

    next();
});

var menu_controller = require("./apis/files/menu.js");
var auth_controller = require("./auth/auth.js");

app.use("/menu", menu_controller);
app.use("/auth", auth_controller);

app.listen(port, () => {
    console.log("server on : localhost:" + port);
});