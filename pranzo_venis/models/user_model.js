var mongoose = require("mongoose");

var user_schema = new mongoose.Schema({
    name: String,
    surname: String,
    email: String,
    password: String,
    power: Number
});

user_schema.query.name_like = function(similar_name) {
    return this.where({
        name: similar_name
    });
};

mongoose.model("user", user_schema);

module.exports = mongoose.model("user");