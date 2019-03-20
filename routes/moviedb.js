var express = require('express');
var router = express.Router();
var request = require("request");

/* GET home page. */
// /home/:access?/:refresh?
router.get('/', function(req, res, next) {

	var options = { method: 'GET',
	  url: 'https://api.themoviedb.org/3/search/movie',
	  qs:
	   { include_adult: 'false',
	     page: '1',
	     query: 'godzilla',
	     language: 'en-US',
	     api_key: '25a4c30966829481bd78912796c376bb' },
	  body: '{}' };

	request(options, function (error, response, body) {
	  if (error) throw new Error(error);
	  let the_data = JSON.parse(body)
	  the_data = the_data.results[0]

	  res.render('moviedbErase', {the_data})
	});
});



module.exports = router;






//https://api.themoviedb.org/3/search/company?api_key=25a4c30966829481bd78912796c376bb&query=godzilla&page=1