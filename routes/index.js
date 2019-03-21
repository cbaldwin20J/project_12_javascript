var express = require('express');
var router = express.Router();
var Previous = require('../models/previous');

// the home url will redirect to '/home'
router.get('', function(req, res, next) {

	res.redirect("/home");

});


// the home page
router.get('/home/:access?/:refresh?', function(req, res, next) {
	// if there is no access token, then redirect to /login which will get one
	if(!req.params.access){
		res.redirect("/spotify/login");
	}

	let access_token = req.params.access
	let refresh_token = req.params.refresh
	// find previous searches
	Previous.find({}, function (err, past_movies) {
		// send user to search page to begin
		res.render("index", {access_token, refresh_token, past_movies});
	});

});

module.exports = router;
