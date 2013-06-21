var db = require('mongojs').connect('rodb', ['feeds', 'users', 'tags']),
	request = require('request');

function updateAccessToken(user, token, callback){
	console.log('db updateAccessToken');
	db.users.findAndModify({
		query: { email: user.email },
		update: { 
			$set: { 
				'tokens.access_token': token,
				'tokens.access_token_date': new Date()
			} 
		}
	});	
}

function login(err, user, callback) {
	console.log('db login');
	db.users.find({
		email: user.email
	}, function(err, entry) {
		if (entry.length === 0) {
			console.log('new user');
			var newUser = {
				_id: user.id,
				email: user.email,
				name: user.name,
				first_name: user.given_name,
				last_name: user.family_name,
				tokens: {
					access_token: user.tokens.access_token,
					refresh_token: user.tokens.refresh_token,
					access_token_date: new Date()
				}
			};
			db.users.save(newUser, function(err, save) {
				callback(newUser, true);
			});
		}
		else {
			console.log('user exists');
			updateAccessToken(entry[0], user.tokens.access_token);
			callback(entry[0]);
		}
	});
}

function getsubs(user, callback) {
	console.log('db getsubs');
	db.users.find({
		email: user.email
	}, function(err, doc) {
		callback(doc[0]);
	});
}

var feeds = {
	insert: function(feed, callback){
		console.log('db feeds.insert');
		feed._id = 'feed/' + feed.xmlurl;
		delete feed.meta;
		db.feeds.insert(feed, function(err, insert){
			if(err && err.code === 11000){
				//console.log(feed._id + ' is already in db');
			}
			else if (err) {
				//console.log(err);
			}
			else{
				//console.log('successfully inserted feed: ' + JSON.stringify(insert));
				callback && callback(insert);
			}
		});
	},
	get: function(query, callback){
		console.log('db feeds.get');
		db.feeds.find(query, function(e, f){
			if (!e) {
				callback && callback(f);
			}
		});

	}
}

var tags = {
	insert: function(taginfo, callback){
		console.log('db tags.insert');
		db.tags.insert({
			_id: taginfo.userId + '/' + taginfo.tag,
			tag: taginfo.tag,
			user: taginfo.userId,
			feed_ids: [ taginfo.feed ]
		}, function(err, insert){
			if(err && err.code === 11000) {
				db.tags.findAndModify({
					query: { 
						_id: taginfo.userId + '/' + taginfo.tag,
						feed_ids: { $ne: taginfo.feed }
					},
					update: { 
						$push: { feed_ids: taginfo.feed } 
					}
				}, function(err, success){
					if(err){
						console.log(err);
					}
				});
			}
		});
	},
	get: function(query, callback){
		console.log('db tags.get');
		db.tags.find(query, function(e, r){
			if (!e) {
				callback && callback(r);
			}
		});
	}
};

exports.updateAccessToken = updateAccessToken;
exports.login = login;
exports.getsubs = getsubs;
exports.feeds = feeds;
exports.tags = tags;