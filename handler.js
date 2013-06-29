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

function savearticles(a, cb){
	var l = a.length;
	console.log(l);
	for(i=0;i<l;i++){
		a[i]._id = 'article/' + a[i].link;
		a[i].feed_id = 'feed/' + url;
	}
	rdb.quickinsert('articles', a);
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

	getarticles: function(req, res) {
		var url = req.query.xmlurl || 'http://roshow.net/feed/';
		var off = req.query.offset || 0;
		var limit = req.query.limit || 10;

		if(req.session.feed && req.session.feed.id === 'feed/' + url){
			res.send([req.session.feed.m, req.session.feed.slice(off,off+limit)]);
		}
		else {
			request({
				url: 'http://ajax.googleapis.com/ajax/services/feed/load',
				qs: {
					q: url,
					v: '1.0',
					num: 100,
					scoring: 'h'
				}
			}, function(e, r, b){
				var d = JSON.parse(b).responseData.feed;
				var m = {
					title: d.title,
					feed_id: 'feed/'+url
				};
				res.send([m, d.entries.slice(off,off+limit)]);
				req.session.feed = {
					id: 'feed/' + url,
					meta: m,
					articles: d.entries
				};
				//save articles to DB:
				//savearticles(d.entries);
			});
		}
	},

	updatearticle: function(req, res){
		var a_id = req.query.aId || 'no article ID',
			f_id = req.query.fId || 'no feed ID';
		rdb.articles.markread({
			_id: req.session.user._id + '/' + f_id
		}, a_id, function(r){
			res.send(r);
		});
	},

	__getarticles_direct: function(req, res) {
		console.log('handling /__getarticles_direct');
		var all = [];
		var meta;
		var uri = req.query.xmlurl || 'http://roshow.net/feed/';
		rdb.articles.get({
			feed_id: 'feed/' + uri
		}, function(a){
			if (a[1].length > 0){
				console.log('from rodb.articles');
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

	__getarticles_db: function(req, res){
		console.log('handling /__getarticles_db');
		var uri = req.query.xmlurl || 'http://roshow.net/feed/',
			feed_id = 'feed/' + uri,
			all = [],
			meta;
		rdb.articles.get({ feed_id: 'feed/' + uri}, function(a){
			if (a[1].length > 0){
				console.log('from rodb.articles');
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
		});
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

	importopml: function(req, res) {
		console.log('handling /importopml');
		var userFeeds = [];
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