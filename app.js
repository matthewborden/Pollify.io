/**
 * Module dependencies.
 */

var express    = require('express'),
	app 	   = require('express')(),
	routes     = require('./routes'),
	http       = require('http'),
	path       = require('path'),
	couchdb    = require('felix-couchdb'),
	client     = couchdb.createClient(5984, 'localhost'),
	crypto     = require('crypto'),
	userlist   = client.db('userslist'),
	shortlinks = client.db('shortlinks'),
	server = app.listen(3000),
	io = require('socket.io').listen(server);


app.configure(function() {
	app.set('views', __dirname + '/views');
	app.set('view engine', 'ejs');
	app.use(express.favicon());
	app.use(express.logger('dev'));
	app.use(express.bodyParser());
	app.use(express.methodOverride());
	app.use(app.router);
	app.use(express.static(path.join(__dirname, 'public')));
});

http.createServer(app).listen(app.get('port'), function() {
	console.log("Express server listening on port " + app.get('port'));
});


io.sockets.on('connection', function (socket) {
  socket.emit('sendData', { hello: 'Matthew Borden' });
  socket.on('my other event', function (data) {
    console.log(data);
  });
});

app.configure('development', function() {
	app.use(express.errorHandler());
});




app.post('/api/setUser', setUser);
app.post('/api/newQuestion', setQuestion);
app.post('/api/setAnswer', setAnswer);
app.post('/api/getQuestion', getQuestion);
app.post('/api/getUser', getUser);
app.get('/', function (req,res) {
	res.render('index',{});
});

function setUser(req, res) {
	userlist.saveDoc(req.body.user, {}, function sendOk(er, ok) {
		res.send(JSON.stringify(ok));
	});
}

function getUser(req, res) {
	console.log(req.body);
	userlist.getDoc(req.body.user, function(er, doc) {
		var questions = [];
		for (var question in doc) {
			if (!doc[question]["state"] && typeof doc[question] === 'object') questions.push(doc[question]);
		}

		res.send(JSON.stringify(questions));

	});

}

function setAnswer(req, res) {

	shortlinks.getDoc(req.body.shortlink, function sendOk(er, shortdoc) {
		userlist.getDoc(shortdoc.author, function(er, doc) {
			var hash = crypto.createHash('md5').update(shortdoc.title).digest("hex");
			if (shortdoc.type == "MC") {
				for (i = 0; i < doc[hash].answers.length; i++) {
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

function setQuestion(req, res) {
	shortlinks.saveDoc(req.body.shortlink, {
		author: req.body.user,
		title: req.body.question,
		type: req.body.type
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
			answers: answers,
			type: req.body.type,
			name: req.body.question,
			state: false,
			shortlink: req.body.shortlink
		};

		userlist.saveDoc(req.body.user, doc, function sendOk(er, ok) {
			res.send(JSON.stringify(ok));
		});
	});
}

function getQuestion(req, res) {
	shortlinks.getDoc(req.body.shortlink, function sendOk(er, shortdoc) {
		if (er) return res.send(404);
		var hash = crypto.createHash('md5').update(shortdoc.title).digest("hex");
		userlist.getDoc(shortdoc.author, function(er, doc) {
			res.send(JSON.stringify(doc[hash]));
		});
	});
}