var express = require('express');
var bodyParser = require('body-parser');
var passport = require('passport');
var User = require('./user');
var Movie = require('./movies');
var Reviews = require('./reviews');
var cors= require('cors');
module.exports = app; // for testing
const http = require('http');
const authController = require('./passport_auth');
const authJwtController = require('./jwt');
db = require('./data'); //global hack
var jwt = require('jsonwebtoken');

var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cors());
app.use(passport.initialize());

var router = express.Router();

function getBadRouteJSON(req, res, route) {
    res.json({success: false, msg: req.method + " requests are not supported by " + route});
}

function getJSONObject(req) {
    var json = {
        headers: "No Headers",
        key: process.env.UNIQUE_KEY,
        body: "No Body"
    };

    if (req.body != null) {
        json.body = req.body;
    }
    if (req.headers != null) {
        json.headers = req.headers;
    }

    return json;
}

function getMoviesJSONObject(req, msg) {
    var json = {
        status: 200,
        message: msg,
        headers: "No Headers",
        query: "No Query String",
        env: process.env.UNIQUE_KEY
    };

    if (req.query != null) {
        json.query = req.query;
    }
    if (req.headers != null) {
        json.headers = req.headers;
    }
    return json;
}

router.route('/post')
    .post(authController.isAuthenticated, function (req, res) {
            console.log(req.body);
            res = res.status(200);
            if (req.get('Content-Type')) {
                console.log("Content-Type: " + req.get('Content-Type'));
                res = res.type(req.get('Content-Type'));
            }
            var o = getJSONObject(req);
            res.json(o);
        }
    );

router.route('/postjwt')
    .post(authJwtController.isAuthenticated, function (req, res) {
            console.log(req.body);
            res = res.status(200);
            if (req.get('Content-Type')) {
                console.log("Content-Type: " + req.get('Content-Type'));
                res = res.type(req.get('Content-Type'));
            }
            res.send(req.body);
        }
    );

    router.post('/signup', function(req, res) {
        if (!req.body.username || !req.body.password) {
            res.json({success: false, msg: 'Please include both username and password to signup.'})
        } else {
            var user = new User();
            user.name = req.body.name;
            user.username = req.body.username;
            user.password = req.body.password;
    
            user.save(function(err){
                if (err) {
                    if (err.code == 11000)
                        return res.json({ success: false, message: 'A user with that username already exists.'});
                    else
                        return res.json(err);
                }
    
                res.json({success: true, msg: 'Successfully created new user.'})
            });
        }
    });
    

    router.post('/signin', function (req, res) {
        var userNew = new User();
        userNew.username = req.body.username;
        userNew.password = req.body.password;
    
        User.findOne({ username: userNew.username }).select('name username password').exec(function(err, user) {
            if (err) {
                res.send(err);
            }
    
            user.comparePassword(userNew.password, function(isMatch) {
                if (isMatch) {
                    var userToken = { id: user.id, username: user.username };
                    var token = jwt.sign(userToken, process.env.SECRET_KEY);
                    res.json ({success: true, token: 'JWT ' + token});
                }
                else {
                    res.status(401).send({success: false, msg: 'Authentication failed.'});
                }
            })
        })
    });
router.route('/movies/:movie_title')
    .get(authJwtController.isAuthenticated,function(req,res)
    {

        let reviews = req.query.reviews == "true";
        if(reviews)
        {
            
            Movie.aggregate
            ([

            {
                $match :{title:req.params.movie_title}
            },

            {
                $lookup:
                {
                    from : "reviews",
                    localField:"title",
                    foreignField: "title",
                    as: "Movies_reviews"

                }
            },

            {
                $addFields:{
                    ReviewNum: {$avg: "reviews.rating"}
                }
            }

            ]).exec(function(error,movie){
                if(error)
                {
                    return res.status(403).json({succes: false, msg:"Cannot get reviews"});
                }
                else 
                {
                    return res.status(200).json({succes: true, msg:"Movie title passed in and its review were.",movie:movie});
                }
            })

        }
        else
        {
            Movie.findOne({title: req.params.movie_title},function(error,movie)
            {
                if (error){
                    return res.status(403).json({succes: false, msg:"Cannot get reviews"});
                }
                else if (!movie){
                    return res.status(403).json({succes: false, msg:"Movie title cannot be found"});
                }                 


            })
        }
        
    })


    .post(authJwtController.isAuthenticated,function(req,res)
    {
        if(!req.body.title|| !req.body.year|| !req.body.Genre|| !req.body.Actors && !req.body.Actors.length)
        {
            res.json({success:false,msg:'Provide movie title, the Year the Movie Released, the Genre, and Actors(Character they Played and Actors real name)'});

        }
        else
        {
            if(req.body.Actors.length < 3)
            {
                res.json({success:false,msg:'Make sure there are a minimum of 3 Actors.'});
            }
            else
            {
                var movie = new Movie();
                movie.title = req.body.title;
                movie.year = req.body.year;
                movie.Genre = req.body.Genre;
                movie.Actors = req.body.Actors;
                
                movie.save(function(error)
                {
                    if (error)
                    {
                        if(error.code==11000)
                            return res.json({success:false,msg:'Movie Title Already exists in DB'});
                        else
                            return res.send(error);
                    }

                    res.json({msg:'Movie has been created'});

                });

            }
        
        }




    })


    .put(authJwtController.isAuthenticated,function(req,res)
    {
        var  id = req.headers.id;
        Movie.findOne({_id:id}).exec(function(error,movie)
        {  
            if(error) res.send(error);
            movie.title = req.body.title;
            movie.year = req.body.year;
            movie.Genre = req.body.Genre;
            movie.Actors = req.body.Actors;
            
            movie.save(function(error)
            {
                if (error)
                    {
                        if(error.code==11000)
                            return res.json({success:false,msg:'Movie Title Already exists in DB'});
                        else
                            return res.send(error);
                    }
                    res.json({msg:'Movie has been created'});
            });
        });
    })




    .delete(authJwtController.isAuthenticated, function (req, res)
    {
        if(!req.body.title)
        {
            return res.json({success:false,msg:'Need a valid movie title'});
        }
        
        else
        {
            Movie.findOne({title: req.body.title}).exec(function(error,result)
            {
                if(req !== null)
                {
                    Movie.remove({title: req.body.title}).exec(function(error)
                    {
                        if (error) res.json({success:false,msg: req.body.title+' is not found'});
                        else res.json({success:true,msg:'Movie has been deleted'});


                    })

                }




            });



        }





    });


router.route('/reviews')
    .post(authJwtController.isAuthenticated,function(req,res)
    { 
        if(!req.body.Movietitle||!req.body.ReviewerName||!req.body.SmallQuote||!req.body.Rating)
        {
            res.json({success:false,msg:'Please Include all required fields'});
        }
        else
        {
            var review = new Reviews();

            jwt.verify(req.headers.authorization.substring(4),process.env.SECRET_KEY,function(error,ver_res)
            {
                if(error)
                {
                    return res.status(403).json({success:false, message:"Review cannot be passed"});

                }
                else
                {
                    review.user_id = ver_res.id;
                    Movie.findOne({title:req.body.Movietitle},function(error,movie)
                    {
                        if(error)
                        {
                            return res.status(403).json({success:false, message:"Cannot post title"});
                        }

                        else if(!movie)
                        {
                            return res.status(403).json({success:false, message:"Cannot find title"});
                        }

                        else
                        {

                            review.Movietitle = req.body.Movietitle;
                            review.ReviewerName = req.body.ReviewerName;
                            review.SmallQuote = req.body.SmallQuote;
                            review.Rating = req.body.Rating;

                            review.save(function(error)
                            {
                                if(error)
                                {
                                return res.status(403).json({success:false, message:"Cannot post title"});
                                }
                                else
                                {
                                    return res.status(200).json({sucess: true, message:"Review succesfully posted", movie:movie});
                                }
                            })

                        }



                    });
                }

            });
        }
        









    })



app.use('/', router);
app.use(function (req, res) {
    getBadRouteJSON(req, res, "this URL path");
});
app.listen(process.env.PORT || 8080);


