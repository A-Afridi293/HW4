var mongoose = require("mongoose");
var Schema = mongoose.Schema;
var bcrypt = require("bcrypt-nodejs");
//TODO: Review https://mongoosejs.com/docs/validation.html

mongoose.Promise = global.Promise;

try {
    mongoose.connect( process.env.DB, {useNewUrlParser: true, useUnifiedTopology: true}, () =>
    console.log("connected"));
    }catch (error) {
    console.log("could not connect");
    }
mongoose.set("useCreateIndex", true);

// movie schema
var MoviesSchema = new Schema({
    title: { type: String, required: true, index: { unique: true } },
    year: { type: String},
    Genre: { type: String, required: true, enum:['Action','Adventure','Comedy','Fantasy','Horror','Mystery','Thriller','Drama','Western']},
    Actors : { type : Array,Name:{type:String},Character:{type:String} }
});

// return the model
module.exports = mongoose.model("Movies", MoviesSchema);

