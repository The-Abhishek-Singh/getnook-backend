const mongoose = require("mongoose");

const linkSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    url: String,
    title: String,
    description: String,
    logo: String,
    image: String,
    publisher: String
}, { timestamps: true });

module.exports = mongoose.model("Link", linkSchema);