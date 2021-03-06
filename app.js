var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const mongoose = require('mongoose');

var indexRouter = require('./routes/index');
var spotifyRouter = require('./routes/spotify');


mongoose.connect("mongodb://localhost:27017/course-api", {autoReconnect: true}, (err) => {
    if (!err) {
    	console.log('********************************MongoDB has connected successfully.')
    }else{
    	console.log('********************************could not connect to MongoDB.')
    }
});

var db = mongoose.connection;

// mongo error
db.on('error', console.error.bind(console, '***************connection error:'));

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
// cookieParser is for the spotify api
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// our routes
app.use('', indexRouter);
app.use('/spotify', spotifyRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
