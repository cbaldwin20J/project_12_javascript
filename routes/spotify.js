const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const url = require('url');

const axios = require('axios');
var request = require("request");

var Previous = require('../models/previous');






var request = require('request'); // "Request" library

var querystring = require('querystring');


var client_id = '3b59d301ecf448daa2fdd98eb479068e'; // Your client id
var client_secret = '1521b9d1b78d48bd96eadce3b95091cb'; // Your secret
var redirect_uri = 'http://localhost:5000/spotify/callback'; // Your redirect uri

/**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */
var generateRandomString = function(length) {
  var text = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  // 'text' contains our random string
  return text;
};

var stateKey = 'spotify_auth_state';





router.get('/login', function(req, res) {

  var state = generateRandomString(16);
  res.cookie(stateKey, state);

  // your application requests authorization
  var scope = 'user-read-private user-read-email';
  // ****** so here it looks like we finally get into the api stuff
  // I believe after this is called it will redirect below to '/callback' automatically
  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri,
      state: state
    }));
});

router.get('/callback', function(req, res) {

  // your application requests refresh and access tokens
  // after checking the state parameter

  // handling the response
  var code = req.query.code || null;
  var state = req.query.state || null;
  var storedState = req.cookies ? req.cookies[stateKey] : null;

  if (state === null || state !== storedState) {
    // ****************** need to update this to http://localhost:3000 or whatever express? is
    res.render("error");
  } else {
    res.clearCookie(stateKey);
    var authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      form: {
        code: code,
        redirect_uri: redirect_uri,
        grant_type: 'authorization_code'
      },
      headers: {
        'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
      },
      json: true
    };

    // here is where we get our authorization code
    request.post(authOptions, function(error, response, body) {
      if (!error && response.statusCode === 200) {

        // putting our tokens in variables
        var access_token = body.access_token,
            refresh_token = body.refresh_token;

        // *** here I should json send both of these tokens to redux to keep in the store
        //res.json({access_token, refresh_token})
        console.log("access_token: " + access_token)
        console.log("refresh_token: " + refresh_token)

        let erase1 = "soundgarden"
        let erase2 = "rules"

        let the_query = "/home/"+access_token+"/"+refresh_token
        //res.render("index", {access_token, refresh_token});
        res.redirect(the_query)





        // we can also pass the token to the browser to make requests from there
        // **** I don't think I need this because I'm not making api calls from redux

      } else {
        res.render("error");

      }
    });
  }
});

// if my auth token doesn't work then trigger this route
router.get('/refresh_token/:refresh_token', function(req, res) {

  // requesting access token from refresh token
  // *** for me I will probably send it as a req.params.token from redux store
  var refresh_token = req.params.refresh_token;
  var authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: { 'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64')) },
    form: {
      grant_type: 'refresh_token',
      refresh_token: refresh_token
    },
    json: true
  };

  // getting a new access token
  request.post(authOptions, function(error, response, body) {
    if (!error && response.statusCode === 200) {
      var access_token = body.access_token;
      // here we want to send our access token to redux using json
      res.redirect("/home", {access_token, refresh_token});

    }else{
      res.render('error')
    }
  });
});





router.get('/movie/:access', (req, res) => {

  let token = req.params.access
  movie_query = req.query.title

  axios({
      method: 'get',
        url: "https://api.spotify.com/v1/search?q=album%3A" + movie_query + "&type=album&market=us&limit=1",
        headers: {
                    "Accept": "application/json",
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + token
                }

  })
    .then(response => {

      let soundtrack_object
      if(typeof response == 'undefined' || typeof response.data == 'undefined'){
        res.render('error', {token});
      }else{
       soundtrack_object = response.data.albums.items[0]
    }

      var options = { method: 'GET',
        url: 'https://api.themoviedb.org/3/search/movie',
        qs:
         { include_adult: 'false',
           page: '1',
           query: movie_query,
           language: 'en-US',
           api_key: '25a4c30966829481bd78912796c376bb' },
        body: '{}' };

      request(options, function (error, response, body) {
        if (error) res.render('error', {token});
        let the_data = JSON.parse(body)
        the_data = the_data.results[0]


          if(typeof soundtrack_object == 'undefined' || typeof soundtrack_object.images[0] == 'undefined'){
            res.render('error', {token})
          }else{


        let instance = new Previous();
        instance.album_cover = soundtrack_object.images[0].url;
        instance.movie_poster = "http://image.tmdb.org/t/p/w185/" + the_data.poster_path
        instance.movie_name = movie_query
        instance.save(function (err) {
          if(err){
            res.render('error', {token})
          }else{
            res.render('movie', {soundtrack_object,the_data, token})
          }

        });
}

      });


    })
    .catch(error => {
      res.render('error', {token})
    })

});

module.exports = router;