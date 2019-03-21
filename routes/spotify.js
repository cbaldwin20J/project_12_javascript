const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const url = require('url');
const axios = require('axios');
var request = require("request");
var querystring = require('querystring');

var Previous = require('../models/previous');

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

// /spotify/login
// will login to Spotify's api
router.get('/login', function(req, res) {

  var state = generateRandomString(16);
  res.cookie(stateKey, state);

  // your application requests authorization
  var scope = 'user-read-private user-read-email';

  // This will login to spotify and it will redirect to '/callback' automatically
  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri,
      state: state
    }));

});

// /spotify/callback
// once logged in to Spotify, Spotify will send user to this route
router.get('/callback', function(req, res) {

  // handling the response
  var code = req.query.code || null;
  var state = req.query.state || null;
  var storedState = req.cookies ? req.cookies[stateKey] : null;

  if (state === null || state !== storedState) {
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

    // here is where we get our access token from Spotify
    request.post(authOptions, function(error, response, body) {
      if (!error && response.statusCode === 200) {

        // putting our tokens in variables
        var access_token = body.access_token,
            refresh_token = body.refresh_token;

        let the_query = "/home/"+access_token+"/"+refresh_token

        //now we have our access token, redirect to the search page to begin
        res.redirect(the_query)

      } else {

        res.render("error");

      }

    });// end of request.post

  }// end of if/else

});


// /spotify/refresh_token
// if my auth token doesn't work then trigger this route
router.get('/refresh_token/:refresh_token', function(req, res) {

  // requesting access token from refresh token
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


// /spotify/movie/:access
// when the user hits the search button it will go here to search spotify and themoviedb
router.get('/movie/:access', (req, res) => {

  // access token for spotify
  let token = req.params.access
  // the input text from the user's search request
  let movie_query = req.query.title

  // go to spotify and search for the movie's soundtrack
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

      // go to themoviedb.org api to get the movie info using the search input text
      request(options, function (error, response, body) {
        if (error) res.render('error', {token});

        let the_data = JSON.parse(body)
        the_data = the_data.results[0]


        if(typeof soundtrack_object == 'undefined' || typeof soundtrack_object.images[0] == 'undefined'){
          res.render('error', {token})
        }else{
          // saving this search instance in the mongodb to be shown on the home page later
          // as a previously searched movie
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
        }// end of if/else
      }); // end of request(options,
    })
    .catch(error => {
      res.render('error', {token})
    })
});

module.exports = router;