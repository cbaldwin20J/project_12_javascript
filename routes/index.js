var express = require('express');
var router = express.Router();


router.get('', function(req, res, next) {

	res.redirect("/home");

});



/* GET home page. */
// /home/:access?/:refresh?
router.get('/home/:access?/:refresh?', function(req, res, next) {
	if(!req.params.access){
		res.redirect("/spotify/login");
	}
	let access_token = req.params.access
	let refresh_token = req.params.refresh
  res.render("index", {access_token, refresh_token});
});



module.exports = router;
