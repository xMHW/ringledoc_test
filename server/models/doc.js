 const { Schema, model } = require('mongoose');

 const Document = new Schema({
     _id: Number,
     data: Object,
 });

 module.exports = model("Document", Document);