//This table is used only for store the index of area table 
//We could calculate the index inside area table each time we insert new data 
//But it's VERY VERY slow because of the multiple layers
//So i use this method instead :) 
var mongoose = require("mongoose");
var Schema = mongoose.Schema;
//
module.exports = mongoose.model('Indexing', new Schema({
    type: String, // Enter any number just for update
    seq: { type: Number, default: 0 }
}));
