var express = require('express');
var router = express.Router();
var Previous = require('../models/previous');


router.get('', function(req, res, next) {

	res.redirect("/home");

});



/* GET home page. */
// /home/:access?/:refresh?
router.get('/home/:access?/:refresh?', function(req, res, next) {
	if(!req.params.access){
		res.redirect("/spotify/login");
	}
	Previous.find()
	let access_token = req.params.access
	let refresh_token = req.params.refresh
	Previous.find({}, function (err, past_movies) {
		res.render("index", {access_token, refresh_token, past_movies});
	});

});



module.exports = router;
