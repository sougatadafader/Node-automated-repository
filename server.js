var express = require('express')
var app = express()
var mongoose = require('mongoose')
var url ='mongodb://mansi:mansi1234@ds259586.mlab.com:59586/heroku_lh1fzvtf';
var useDb = 'heroku_lh1fzvtf';

var conn = mongoose.connect('mongodb://mansi:mansi1234@ds259586.mlab.com:59586/heroku_lh1fzvtf',
  {useNewUrlParser: true});

var pageSchema = mongoose.Schema({
	title: String
}, {collection: 'students'});

var pageModel = mongoose.model('PageModel', pageSchema)

var bodyParser = require('body-parser')
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

// Configure CORS
app.use(function(req, res, next) {
   res.header("Access-Control-Allow-Origin",
       "http://localhost:4200");
   res.header("Access-Control-Allow-Headers",
       "Origin, X-Requested-With, Content-Type, Accept");
   res.header("Access-Control-Allow-Methods",
       "GET, POST, PUT, DELETE, OPTIONS");
   res.header("Access-Control-Allow-Credentials", "true");
   next();
});


var tableService = require(
	'./services/table.service.server.js')


tableService(app,url,useDb)

app.listen(process.env.PORT || 3000)
