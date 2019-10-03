var mongoose = require("mongoose");

var ing_schema = new mongoose.Schema({
    name: String
});
mongoose.model("ingredients", ing_schema);

module.exports = mongoose.model("ingredients");