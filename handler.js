var parser = require('xml2json'),
	FeedParser = require('feedparser'),
	request = require('request'),
	googleapis = require('googleapis'),
	client_id = CONFIG.google.client_id,
	client_secret = CONFIG.google.client_secret,
	oauth2Client = new googleapis.OAuth2Client(client_id, client_secret, 'http://localhost:3000/googleoauth'),
	rdb = require('./rdb.js').rdb,
	OpmlParser = require('opmlparser');

function addfeeds_loop(j, subs, callback) {
	var L = subs.length;
	rdb.feeds.get({
		_id: {
			$in: subs[j].feed_ids
		}
	}, false, function(f) {
		subs[j].feeds = f;
		if (j < L - 1) {
			addfeeds_loop(j + 1, subs, callback);
		}
		else {
			callback && callback(subs);
		}
	});
}

var handler = {

	getroot: function(req, res) {
		console.log('handling /');

		if (!req.session.user) {
			res.send('<a href="/googleoauth" style="text-decoration:none;font-weight:bold;">LOG IN WITH GOOGLE</a>');
		}
		else {
			res.redirect('/roreader.html');
		}
	},

	googleoauth: function(req, res) {
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
						rdb.login(err, user, oauth2Client.credentials, function(userDB, newUser) {
							req.session.user = userDB;
							res.redirect(newUser ? '/importopml' : '/');
						});
					});
				});
			});
		}
	},

	getfeed: function(req, res) {
		console.log('handling /getfeed');
		var all = [];
		var meta;
		var uri = req.query.url || 'http://roshow.net/feed/';
		rdb.articles.get({
			feed_id: 'feed/' + uri
		}, function(a){
			if (a[1].length > 0){
				console.log('from rodb.a2');
				res.send(a);
			}
			else {
				request(uri)
				.pipe(new FeedParser())
				.on('error', function(error) {
				console.log(error);
				})
				.on('meta', function(m) {
					meta = m;
				})
				.on('readable', function() {
					var article;
					while (article = this.read()){
						rdb.articles.insert(article, 'feed/' + uri);
						all.push(article);
					}
				})
				.on('end', function(){
					console.log('from xml feed');
					res.send([meta, all]);
				});
			}
		});
	},

	play: function(req, res){
		console.log('handling /play');
		var uri = req.query.url || 'http://roshow.net/feed/',
			feed_id = 'feed/' + uri,
			all = [],
			meta;

		rdb.feeds.get({_id:feed_id}, false, function(f){
			f = f[0];
			request(uri)
				.pipe(new FeedParser())
				.on('error', function(e) {
				console.log(e);
				})
				.on('meta', function(m) {
					meta = m;
					if(!f.date || f.date < m.date){
						console.log('no or old date, should be: ' + m.date);
					}
					else{
						console.log('updated at: ' + f.date);
					}
				});
		});
		/*rdb.articles.get({ feed_id: 'feed/' + uri}, function(a){
			if (a[1].length > 0){
				console.log('from rodb.a2');
				res.send(a);
			}
			else {
				request(uri)
					.pipe(new FeedParser())
					.on('error', function(e) {
					console.log(e);
					})
					.on('meta', function(m) {
						meta = m;
						this.end
					})
					.on('readable', function() {
						var article;
						while (article = this.read()){
							rdb.articles.insert(article, meta, feed_id);
							all.push(article);
						}
					})
					.on('end', function(){
						console.log('from xml feed');
						res.send([meta, all]);
					});
			}
		});*/
	},

	getsubs: function(req, res) {
		console.log('handling /getsubs');
		var user = req.session.user;
		if (req.query.allfeeds === 'true') {
			rdb.feeds.get({
				users: user._id
			}, false, function(f) {
				res.send(f);
			});
		}
		else {
			rdb.tags.get({
				user: user._id
			}, false, function(r) {
				if (r.length > 0) {
					addfeeds_loop(0, r, function(f) {
						res.send(f);
					});
				}
			});
		}
	},

	echo: function(req, res) {
		console.log("handling /echo");
		res.send('echo ' + JSON.stringify(req.query));
	},

	error404: function(req, res) {
		console.log("handling *");
		res.send("404 Error. This path doesn't exist.", 404);
	},

	importopml: function(req, res) {
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
			.on('outline', function(outline) {
			//console.log(outline);
		})
			.on('feed', function(feed) {
			console.log('adding to db.feeds');
			rdb.feeds.insert(feed, req.session.user);
			console.log('adding to db.tags');
			var tag = (feed.folder !== '') ? feed.folder : 'Uncategorized';
			rdb.tags.insert({
				tag: tag,
				user_id: req.session.user._id,
				feed: 'feed/' + feed.xmlurl
			});
		})
			.on('end', function() {
			console.log('opml done');
			res.redirect('/');
		});
	},

	refreshToken: function(req, res) {
		request.post({
			url: 'https://accounts.google.com/o/oauth2/token',
			form: {
				client_id: client_id,
				client_secret: client_secret,
				refresh_token: req.session.user.tokens.refresh_token,
				grant_type: 'refresh_token'
			}
		}, function(e, r, b) {
			var newToken = JSON.parse(r.body).access_token;
			rdb.updateAccessToken(req.session.user, newToken);
			req.session.user.tokens.access_token = newToken;
			req.session.user.tokens.access_token_date = new Date();
			res.redirect('/' + (req.query.url || ''));
		});
	}
};

exports.handler = handler;