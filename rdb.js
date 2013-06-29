//try { CONFIG = require('./config.js');console.log('config.js'); }
//catch(e){ CONFIG = require('./config_example.js');console.log('config_example.js'); }

var db = require('mongojs').connect(CONFIG.mongo.uri, ['feeds', 'users', 'tags', 'articles', 'read']),
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
	this.starred = [];
	this.feeds = [];
	//this.feeds[x] = {
	//	id: '12345',
	//	date: ISODate,
	//	read: [ 'article1_url', 'article2_url']
	//}
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

function Article(a) {
	this._id = a.guid;
	this.feed_id = a.feed_id || f_id || 'feed/' + a.meta.xmlurl;
	this.feed_title = '';
	this.link = a.link;
	this.title = a.title;
	this.description = a.description;
	this.summary = a.summary;
	this.date = a.date;
	this.pubdate = a.pubdate;
	this.author = a.author;
	this.comments = a.comments;
}

var rdb = {

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
			db.users.findAndModify({
				query: {
					_id: user_id
				},
				update: {
					$addToSet: {
						feeds: {
							id: feed_id,
							date: new Date(),
							read: []
						}
					}
				}
			});
		},
		update: function(q, up, cb){
			console.log('db feeds.update');
			db.feeds.findAndModify({
				query: q,
				update: up
			}, function(e, f){
				cb(f);
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
					//console.log(articleDB._id + 'is already in the articles collection');
				}
				else {
					//console.log(articleDB._id + ' added to the articles collection');
				}
			});
		},
		get: function(q, cb){
			console.log('db articles.get');
			db.articles.find(q).limit(10, function(e, a){
				if(!e && cb) {
					cb([{title: 'blank' },a]);
				}
			});
		},
		markread: function(q, a_id, cb){
			console.log(q);
			db.read.findAndModify({
				query: q,
				update: {
					$addToSet: {
						read: a_id
					}
				},
				new: true
			}, function(e,r){
				cb && cb(r);
			});
		},
		__get_bydate: function(){
			var as = [];
			db.articles.find({}, function(e,a){
				//console.log(a[0].title);
				var l = a.length,
					j = 0;
				for (i = 0; i < l; i++) {
					var articlesDB = new Article(a[i]);
					db.articles.insert(articlesDB, function(e){
						if(e){
							console.log(e.code);
							j=j+1;
						}
						else {
							console.log('articles inserted');
							j=j+1;
						}
					})
				}
			});
		}
	},

	read: {
		remove: function(q, a_id, cb){
			db.read.findAndModify({
				query: {
					user_id: u,
					feed_id: f
				},
				update: {
					$pull: {
						read: a_id
					}
				},
				new: true
			}, function(r){
				cb && cb(r);
			});
		}
	},

	quickinsert: function(c, e){
		db[c].insert(e);
	},

	__importAllArticles: function(){
		function importall(url){
			request({
				url: 'http://ajax.googleapis.com/ajax/services/feed/load',
				qs: {
					q: url,
					v: '1.0',
					num: 1000,
					scoring: 'h'
				}
			}, function(e, r, b){
				var d = JSON.parse(b).responseData.feed;
				var l = d.entries.length;
				console.log(l);
				for(i=0;i<l;i++){
					d.entries[i]._id = 'article/' + d.entries[i].link;
					d.entries[i].feed_id = 'fee3d/' + url;
				}
				rdb.quickinsert('articles', d.entries);
			});
		}
		db.feeds.find({}, function(e,f){
			for(j=0;j<f.length;j++){
				importall(f[j].xmlurl);
			}
		});
	}
};

exports.rdb = rdb;