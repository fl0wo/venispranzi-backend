var mongoose = require("mongoose");

var url =
    "mongodb+srv://cruc:cruc@fiero-gojey.gcp.mongodb.net/test?retryWrites=true&w=majority";
var url_local =
    "mongodb://localhost:27017/venis_pranzi";

mongoose.connect(url_local, { useNewUrlParser: true, useUnifiedTopology: true }, (err, db) => {
    if (err) throw err;
    console.log("ez connected");
});