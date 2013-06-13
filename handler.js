var parser = require('xml2json'),
	FeedParser = require('feedparser'),
	request = require('request'),
	db = require('mongojs').connect('mydb', ['feeds']),
	googleapis = require('googleapis'),
	client_id = '90018158841.apps.googleusercontent.com',
	client_secret = 'K9HzQVn1PATjX5LgQOsaXs40',
	oauth2Client = new googleapis.OAuth2Client(client_id, client_secret, 'http://localhost:3000/googleoauth');

function googleoauth(req, res) {
	console.log('handling /googleoauth');
	if (!req.query.code) {
		var url = oauth2Client.generateAuthUrl({
			//approval_prompt: 'force',
			access_type: 'offline',
			scope: 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email https://www.google.com/reader/api'
		});
		res.redirect(url);
	}
	else {
		oauth2Client.getToken(req.query.code, function(err, tokens) {
			console.log(tokens);
			req.session.google = tokens;
			oauth2Client.credentials = tokens;
			res.redirect('/');
		});
	}
}

function getroot(req, res) {
	console.log('handling /');

	if (!req.session.google) {
		res.send('<a href="/googleoauth" style="text-decoration:none;font-weight:bold;">LOG IN WITH GOOGLE</a>');
	}
	else {
		var reqOpt = {
			url: 'https://www.google.com/reader/api/0/subscription/list',
			qs: {
				output: 'json', 
				access_token: req.session.google.access_token,
				token_type: req.session.google.token_type
			}
		};
		request(reqOpt, function(error, response, body){
			if (error) {
				console.log(error);
			}
			else {
				res.send(JSON.parse(body));
			}
		});
	}
}

function getfeed(req, res) {
	console.log('handling /getfeed');
	request(req.query.url)
		.pipe(new FeedParser())
		.on('error', function(error) {
		console.log(error);
	})
		.on('complete', function(meta, articles) {
		res.send([meta, articles]);
	})
		.on('end', function() {
		console.log('parsing done');
	});
}

function importsubs(req, res) {
	console.log('handling /importsubs');
	request('http://localhost:3000/subscriptions.xml', function(error, response, body) {
		var feedsJson = JSON.parse(parser.toJson(body));
		var subs = feedsJson.opml.body.outline;
		var L = subs.length,
			L2, innerSubs, j, i;
		for (i = 0; i < L; i++) {
			if (subs[i].outline) {
				innerSubs = (subs[i].outline instanceof Array) ? subs[i].outline : [subs[i].outline];
				L2 = innerSubs.length;
				for (j = 0; j < L2; j++) {
					db.feeds.save(innerSubs[j]);
				}
			}
			else {
				db.feeds.save(subs[i]);
			}
		}
		db.feeds.find({}, function(err, feed) {
			res.send(feed);
		});
	});
}

function getsubs(req, res) {
	console.log('handling /getsubs');
	db.feeds.find({}, function(err, feed) {
		if (feed.length === 0) {
			importsubs(req, res);
		}
		else {
			console.log(feed.length);
			res.send(feed);
		}
	});
}

function echo(req, res) {
	console.log("handling /echo");
	res.send('echo ' + JSON.stringify(req.query));
}

function error404(req, res) {
	console.log("handling *");
	res.send("404 Error. This path doesn't exist.", 404);
}

exports.googleoauth = googleoauth;
exports.getroot = getroot;
exports.getfeed = getfeed;
exports.importsubs = importsubs;
exports.getsubs = getsubs;
exports.echo = echo;
exports.error404 = error404;