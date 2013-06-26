var db = require('mongojs').connect(CONFIG.mongo.uri, ['feeds', 'users', 'tags', 'articles', 'a2']),
	request = require('request');

function User(u, t) {
	this._id = u.id || new db.ObjectId();
	this.email = u.email;
	this.name = u.name;
	this.first_name = u.given_name;
	this.last_name = u.family_name;
	this.tokens = {};
	this.tokens.access_token = t.access_token || null;
	this.tokens.refresh_token = t.refresh_token || null;
	this.tokens.access_token_date = t.access_token ? new Date() : null;
}

function Feed(f, u) {
	this._id = 'feed/' + f.xmlurl;
	this.title = f.title;
	this.title_alpha = f.title.toLowerCase();
	this.type = f.type;
	this.xmlurl = f.xmlurl;
	this.htmlurl = f.htmlurl;
	this.users = u._id ? [u._id] : [];
}

function Tag(t) {
	this._id = t.user_id + '/' + t.tag;
	this.tag = t.tag;
	this.tag_alpha = t.tag.toLowerCase();
	this.user = t.user_id;
	this.feed_ids = [t.feed];
}

function Article(a, f_id) {
	this._id = a.guid;
	this.feed_id = a.feed_id || f_id || 'feed/' + a.meta.xmlurl;
	this.link = a.link;
	this.title = a.title;
	this.description = a.description;
	this.summary = a.summary;
	this.date = a.date;
	this.pubdate = a.pubdate;
	this.author = a.author;
	this.comments = a.comments;
}

var roreaderDb = {

	play: function(){
		db.articles.find().limit(10).forEach(function(e,a){
			var a2DB = new Article(a);
			db.a2.insert(a2DB, function(e){
				if(e){
					console.log(e.code);
				}
				else {
					console.log('a2 inserted');
				}
			});
		});
	},

	updateAccessToken: function(user, token) {
		console.log('db updateAccessToken');
		db.users.findAndModify({
			query: {
				email: user.email
			},
			update: {
				$set: {
					'tokens.access_token': token,
					'tokens.access_token_date': new Date()
				}
			}
		});
	},

	login: function(err, user, tokens, callback) {
		console.log('db login');
		var that = this;
		db.users.find({
			email: user.email
		}, function(err, entry) {
			if (entry.length === 0) {
				console.log('new user');
				var userDB = new User(user, tokens);
				db.users.save(userDB, function(err, save) {
					callback(userDB, true);
				});
			}
			else {
				console.log('user exists');
				that.updateAccessToken(entry[0], tokens.access_token);
				callback(entry[0]);
			}
		});
	},

	getsubs: function(user, callback) {
		console.log('db getsubs');
		db.users.find({
			email: user.email
		}, function(err, doc) {
			callback(doc[0]);
		});
	},

	feeds: {
		adduser: function(feed_id, user_id, callback) {
			console.log('db feeds.adduser');
			db.feeds.findAndModify({
				query: {
					_id: feed_id
				},
				update: {
					$addToSet: {
						users: user_id
					}
				},
				new: true
			}, function(e, updatedFeed) {
				if (e) {
					console.log(e);
				}
				else {
					callback && callback(updatedFeed)
				}
			});
		},
		insert: function(feed, user, callback) {
			console.log('db feeds.insert');
			var that = this;
			var feedDB = new Feed(feed, user);
			db.feeds.insert(feedDB, function(e) {
				if (e && e.code === 11000) {
					console.log(feedDB._id + ' is already in db');
					that.adduser(feedDB._id, user._id);
				}
				else if (e) {
					console.log(e);
				}
				else {
					callback && callback(feedDB);
				}
			});
		},
		get: function(query, sort, callback) {
			console.log('db feeds.get');
			db.feeds.find(query).sort((sort || {
				title_alpha: 1
			}), function(e, f) {
				if (!e) {
					callback && callback(f);
				}
			});
		}
	},

	tags: {
		addfeeds: function(tag_id, feed_ids, callback) {
			feed_ids = (feed_ids.constructor === Array) ? feed_ids : [feed_ids];
			db.tags.findAndModify({
				query: {
					_id: tag_id
				},
				update: {
					$addToSet: {
						feed_ids: {
							$each: feed_ids
						}
					}
				},
				new: true
			}, function(e, updatedTag) {
				if (e) {
					console.log(e);
				}
				else {
					callback && callback(updatedTag);
				}
			});
		},
		insert: function(tag, callback) {
			var that = this;
			console.log('db tags.insert');
			var tagDB = new Tag(tag);
			db.tags.insert(tagDB, function(e) {
				if (e && e.code === 11000) {
					that.addfeeds(tagDB._id, tagDB.feed_ids);
				}
				else if (e) {
					console.log(e);
				}
				else {
					callback && callback(tagDB);
				}
			});
		},
		get: function(query, sort, callback) {
			console.log('db tags.get');
			db.tags.find(query).sort((sort || {
				tag_alpha: 1
			}), function(e, r) {
				if (!e) {
					callback && callback(r);
				}
			});
		}
	},

	articles: {
		insert: function(article, feed_id){
			var articleDB = article;
			article._id = article.guid;
			articleDB.feed_id = feed_id;
			db.articles.insert(articleDB, function(e, a){
				if (e && e.code === 11000){
					console.log(articleDB._id + 'is already in the articles collection');
				}
				else {
					console.log(articleDB._id + ' added to the articles collection');
				}
			});
		}
	}
};

exports.roreaderDb = roreaderDb;