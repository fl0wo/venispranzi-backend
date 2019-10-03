var mongoose = require("mongoose");

var menu_schema = new mongoose.Schema({
    name_file: String,
    inserted_by: Object,
    inserted_on: Date,
    plates: Array,
    participants: Array
});
mongoose.model("menus", menu_schema);

module.exports = mongoose.model("menus");