var parser = require('xml2json'),
  FeedParser = require('feedparser'),
  request = require('request'),
  db = require('mongojs').connect('mydb', ['feeds']),
  googleapis = require('googleapis'),
  client_id = '90018158841.apps.googleusercontent.com',
  client_secret = 'K9HzQVn1PATjX5LgQOsaXs40',
  oauth2Client = new googleapis.OAuth2Client(client_id, client_secret, 'http://localhost:3000/googleoauth');

function googleoauth(req, res){
	console.log('handling /getsubs');1
	if (!req.query.code) {
	var url = oauth2Client.generateAuthUrl({
		approval_prompt: 'force',
		access_type: 'offline',
		scope: 'https://www.googleapis.com/auth/userinfo.profile https://www.google.com/reader/api'
	});
	res.redirect(url);
}
else {
	oauth2Client.getToken(req.query.code, function(err, tokens) {
		req.session.google = tokens;
		console.log(req.query.code);
		console.log(tokens);
		res.redirect('/google');
	});
}
}

function getfeed(req, res){
	console.log('handling /getfeed');
	request(req.query.url)
	  .pipe(new FeedParser())
	  .on('error', function(error) {
	    console.log(error);
	  })
	  .on('complete', function (meta, articles) {
	    res.send([meta, articles]);
	  })
	  .on('end', function () {
	   console.log('parsing done');
	  });
}

function importsubs(req, res){
	console.log('handling /importsubs');
	request('http://localhost:3000/subscriptions.xml', function(error, response, body){
		var feedsJson = JSON.parse(parser.toJson(body));
		var subs = feedsJson.opml.body.outline;
		var L = subs.length,
		L2, innerSubs, j, i;
		for (i = 0; i < L; i++) {
			if (subs[i].outline) {
				innerSubs = (subs[i].outline instanceof Array) ? subs[i].outline : [ subs[i].outline ];
				L2 = innerSubs.length;
				for (j = 0; j < L2; j++) {
					db.feeds.save(innerSubs[j]);
				}
			}
			else {
				db.feeds.save(subs[i]);
			}
		}
		db.feeds.find({}, function(err, feed){
			res.send(feed);
		});
	});
}

function getsubs(req, res){
	console.log('handling /getsubs');
	db.feeds.find({}, function(err, feed){
		if (feed.length === 0){
			importsubs(req, res);
		}
		else {
			console.log(feed.length);
			res.send(feed);
		}
	});
}

function echo(req, res){
	console.log("handling /echo");
	res.send('echo ' + JSON.stringify(req.query));
}

function error404(req, res){
	console.log("handling *");
	res.send("404 Error. This path doesn't exist.", 404);
}

exports.googleoauth = googleoauth;
exports.getfeed = getfeed;
exports.importsubs = importsubs;
exports.getsubs = getsubs;
exports.echo = echo;
exports.error404 = error404;