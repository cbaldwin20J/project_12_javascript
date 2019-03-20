var express = require('express');
var router = express.Router();

/* GET home page. */
// /home/:access?/:refresh?
router.get('/:access?/:refresh?', function(req, res, next) {
	if(!req.params.access){
		res.redirect("/spotify/login");
	}
	let access_token = req.params.access
	let refresh_token = req.params.refresh
  res.render("index", {access_token, refresh_token});
});



module.exports = router;
