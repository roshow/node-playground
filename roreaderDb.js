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

function feedsInsert(feed, callback){
	console.log('db feedsInsert');
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
}

function tagsInsert(taginfo, callback){
	console.log('db taginfo');
	db.tags.insert({
		_id: taginfo.userId + '/' + taginfo.tag,
		user: taginfo.userId,
		feeds: [ taginfo.feed ]
	}, function(err, insert){
		if(err && err.code === 11000) {
			db.tags.findAndModify({
				query: { 
					_id: taginfo.userId + '/' + taginfo.tag,
					feeds: { $ne: taginfo.feed }
				},
				update: { 
					$push: { feeds: taginfo.feed } 
				}
			}, function(err, success){
				if(err){
					console.log(err);
				}
			});
		}
	});
}

exports.updateAccessToken = updateAccessToken;
exports.login = login;
exports.getsubs = getsubs;
exports.feedsInsert = feedsInsert;
exports.tagsInsert = tagsInsert;