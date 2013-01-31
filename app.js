
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , http = require('http')
  , path = require('path'),
  couchdb = require('felix-couchdb'),
  client = couchdb.createClient(5984, 'localhost'),
  crypto = require('crypto'),
  userlist = client.db('userslist'),
  shortlinks = client.db('shortlinks');
  

var app = express();
app.post('/setUser', setUser);
app.post('/newQuestion', setQuestion);
app.post('/setAnswer', setAnswer);
app.get('/getQuestion/:shortlink', getQuestion);

app.configure(function(){
  app.set('port', process.env.PORT || 8080);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});


function setUser(req,res) {
	userlist.saveDoc(req.body.user, {}, function sendOk(er, ok) {
		res.send(JSON.stringify(ok));
	});
}
function getUser (req,res) {
	userlist.getDoc(req.body.user, function(er, doc) {
		for(var i = 0; i < doc)
	});
	
	res.render('new', );
}
function setAnswer(req,res) {
	
	shortlinks.getDoc(req.body.shortlink, function sendOk(er, shortdoc) {
		userlist.getDoc(shortdoc.author, function(er, doc) {
			var hash = crypto.createHash('md5').update(shortdoc.title).digest("hex");
			if (shortdoc.type == "MC") {
				for(i = 0; i < doc[hash].answers.length; i++) { 	
					if (doc[hash].answers[i].name == req.body.answer) {
						doc[hash].answers[i].count = doc[hash].answers[i].count + 1;
					}
				}			
			} else {
				doc[hash].answers.push(req.body.answer);
			}
		
			userlist.saveDoc(shortdoc.author, doc, function sendOk(er, ok) {
				res.send(JSON.stringify(ok));
			});
		});
	});
}

function setQuestion(req,res) {
	shortlinks.saveDoc(req.body.shortlink, {
		author:req.body.user, 
		title:req.body.question, 							
		type:req.body.type 
	}, function sendOk(er, ok) {
	
	});
	
	var hash = crypto.createHash('md5').update(req.body.question).digest("hex");
	userlist.getDoc(req.body.user, function(er, doc) {
		if (req.body.type == "MC") {
			answers = [];
			req.body.choices.forEach(function(item) { 
				answers.push({
					count: 0,
					name: item
				});
			});
		} else {
			answers = [];
		}
		
		doc[hash] = {
			answers:answers,
			type:req.body.type,
			name:req.body.question
		};
		userlist.saveDoc(req.body.user, doc, function sendOk(er, ok) {
			res.send(JSON.stringify(ok));
		});
	});
}

function getQuestion(req,res) {
	shortlinks.getDoc(req.param('shortlink'), function sendOk(er, shortdoc) {
		if (er) return res.send(404);
		var hash = crypto.createHash('md5').update(shortdoc.title).digest("hex");
		userlist.getDoc(shortdoc.author, function(er, doc) {
			res.render('index', doc[hash]);
		});
	});
}

