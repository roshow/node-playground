var parser = require('xml2json'),
	FeedParser = require('feedparser'),
	request = require('request'),
	googleapis = require('googleapis'),
	client_id = '90018158841.apps.googleusercontent.com',
	client_secret = 'K9HzQVn1PATjX5LgQOsaXs40',
	oauth2Client = new googleapis.OAuth2Client(client_id, client_secret, 'http://localhost:3000/googleoauth'),
	roreaderDb = require('./roreaderDb.js'),
	OpmlParser = require('opmlparser');

function getroot(req, res) {
	console.log('handling /');

	if (!req.session.user) {
		res.send('<a href="/googleoauth" style="text-decoration:none;font-weight:bold;">LOG IN WITH GOOGLE</a>');
	}
	else {
		res.redirect('/getopml');
	}

}

function googleoauth(req, res) {
	console.log('handling /googleoauth');
	//if no code parameter, then this is being visited for an initial login, so redirect to Google
	if (!req.query.code) {
		var url = oauth2Client.generateAuthUrl({
			//approval_prompt: 'force',
			access_type: 'offline',
			scope: 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email https://www.google.com/reader/subscriptions/export'
		});
		res.redirect(url);
	}
	//redirect with access code from Google; trade it in for a token and save to DB, then save in sessions and redirect to roreader.html
	else {
		oauth2Client.getToken(req.query.code, function(err, tokens) {
			oauth2Client.credentials = tokens;
			googleapis.discover('oauth2', 'v2')
				.execute(function(err, client) {
				client.oauth2.userinfo.get()
					.withAuthClient(oauth2Client)
					.execute(function(err, user) {
						user.tokens = oauth2Client.credentials;
						roreaderDb.googleoauth(err, user, function(resDB) {
							req.session.user = resDB;
							res.redirect('/getopml');
						});
					});
				});
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

function getsubs(req, res) {
	console.log('handling /getsubs');
	var user = req.session.user;
	roreaderDb.getsubs(user, function(subs) {
		res.send(subs);
	});
}

function importsubs(req, res) {
	console.log('handling /importsubs');
	var user = req.session.user;
	roreaderDb.importsubs(user, function(doc) {
		res.send(doc);
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

function getopml(req, res) {
	console.log('handling /getopml');
	var reqOpt = {
		url: 'https://www.google.com/reader/subscriptions/export',
		qs: {
			access_token: req.session.user.tokens.access_token
		}
	};
	request(reqOpt)
		.pipe(new OpmlParser())
		.on('error', function(error) {
		    console.log(error);
		    res.send(error);
		})
		.on('complete',function (meta, feeds, outline){
			res.send(outline);
		});
}

exports.getopml = getopml;
exports.googleoauth = googleoauth;
exports.getroot = getroot;
exports.getfeed = getfeed;
exports.importsubs = importsubs;
//exports.importsubs_opml = importsubs_opml;
exports.getsubs = getsubs;
exports.echo = echo;
exports.error404 = error404;

/*function importsubs_opml(req, res) {
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
					roreaderDb.feeds.save(innerSubs[j]);
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
}*/