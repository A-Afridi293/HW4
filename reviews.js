var mongoose = require("mongoose");
var Schema = mongoose.Schema;
var bcrypt = require("bcrypt-nodejs");
//TODO: Review https://mongoosejs.com/docs/validation.html

mongoose.Promise = global.Promise;

try {
    mongoose.connect( process.env.DB, {useNewUrlParser: true, useUnifiedTopology: true}, () =>
    console.log("connected"));
    }
catch (error) {
    console.log("could not connect");
    }
mongoose.set("useCreateIndex", true);

// movie schema
var ReviewSchema = new Schema({
    Movietitle: [{ type: String, required: true, ref:"Movie" }],
    ReviewerName: {type: String, required: true },
    SmallQuote:{type: String, required: true},
    Rating:{type:Number, max:5,min:1, required:true},
    user_id:{type:Schema.Types.ObjectID,ref:"User"},
    movie_id:{type:Schema.Types.ObjectID,ref:"Movies"}
 
});


ReviewSchema.pre("save", function (next) {
    if(this.length ==0){
        return next(new error('Only one reviewer allowed'))
    }
    next()
  });
// return the model
module.exports = mongoose.model("Reviews", ReviewSchema);

