var mongoose = require("mongoose");

var menu_schema = new mongoose.Schema({
    name_file: String,
    inserted_by: String,
    inserted_on: Date
});
mongoose.model("menus", menu_schema);

module.exports = mongoose.model("menus");