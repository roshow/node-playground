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
		res.redirect('/roreader.html');
	}

}

function googleoauth(req, res) {
	console.log('handling /googleoauth');
	//if no code parameter, then this is being visited for an initial login, so redirect to Google
	if (!req.query.code) {
		var url = oauth2Client.generateAuthUrl({
			approval_prompt: 'force',
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
						roreaderDb.login(err, user, function(userDB, newUser) {
							req.session.user = userDB;
							res.redirect(newUser ? '/importopml' : '/');
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
	roreaderDb.tags.get({ user: user._id }, function(r) {
		var L = r.length;
		function addfeeds(j){
			roreaderDb.feeds.get({
				_id: {
					$in: r[j].feed_ids
				}
			}, 
			function(f){
				r[j].feeds = f;
				if (j < L-1){
					console.log('L = ' + L);
					addfeeds(j+1);
				}
				else {
					res.send(r);
				}
			});
		}
		addfeeds(0);
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

function importopml(req, res) {
	console.log('handling /importopml');
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
		.on('outline', function(outline){
			console.log(outline);
		})
		.on('feed', function(feed){
			console.log('adding to db.feeds');
			roreaderDb.feeds.insert(feed);
			console.log('adding to db.tags');
			var tag = (feed.folder !== '') ? feed.folder : 'Uncategorized';
			roreaderDb.tags.insert({
				tag: tag,
				userId: req.session.user._id,
				feed: 'feed/' + feed.xmlurl
			});
		})
		.on('end', function(){
			console.log('opml done');
			res.redirect('/');
		});
}

function refreshToken(req, res){
	request.post({
		url:'https://accounts.google.com/o/oauth2/token',
		form: { 
			client_id: client_id,
			client_secret: client_secret,
			refresh_token: req.session.user.tokens.refresh_token,
			grant_type: 'refresh_token' 
		}
	}, function(e,r,b){
		var newToken = JSON.parse(r.body).access_token;
		roreaderDb.updateAccessToken(req.session.user, newToken);
		req.session.user.tokens.access_token = newToken;
		req.session.user.tokens.access_token_date = new Date();
		res.redirect('/' + req.query.url);
	});
}

exports.refreshToken = refreshToken;
exports.importopml = importopml;
exports.googleoauth = googleoauth;
exports.getroot = getroot;
exports.getfeed = getfeed;
exports.getsubs = getsubs;
exports.echo = echo;
exports.error404 = error404;