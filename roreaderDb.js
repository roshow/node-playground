var db = require('mongojs').connect('mydb', ['feeds', 'users', 'feedex']),
	request = require('request');

function login(err, user, callback) {
	db.users.find({
		email: user.email
	}, function(err, entry) {
		if (entry.length === 0) {
			console.log('new user');
			db.users.save({
				_id: user.id,
				email: user.email,
				name: user.name,
				first_name: user.given_name,
				last_name: user.family_name,
				tokens: user.tokens
			}, function(err, save) {
				callback(save);
			});
		}
		else {
			console.log('user exists');
			callback(entry[0]);
		}
	});
}

function getsubs(user, callback) {
	console.log('db getsubs');
	db.users.find({
		email: user.email
	}, function(err, doc) {
		console.log(doc);
		if (doc[0].subscriptions) {
			console.log('getting subs');
			callback(doc[0].subscriptions);
		}
		else {
			console.log('importing subs');
			importsubs(doc[0], callback);
		}
	});
}

function importsubs(user, callback){
	console.log('parsing subs');
			var reqOpt = {
				url: 'https://www.google.com/reader/api/0/subscription/list',
				qs: {
					output: 'json',
					access_token: user.tokens.access_token,
					token_type: user.tokens.token_type
				}
			};
			request(reqOpt, function(error, response, body) {
				if (error) {
					callback(error);
				}
				else {
					var subs = JSON.parse(body).subscriptions,
						L = subs.length,
						parsedSubs = [],
						parsedFeeds = [],
						i;
					for(i=0;i < L;i++){
						console.log(subs[i]);
						parsedSubs.push({
							id: subs[i].id,
							tags: []
						});
						var feed = {
							_id: subs[i].id,
							xmlUrl: subs[i].id.substring(subs[i].id.indexOf('http')),
							htmlUrl: subs[i].htmlUrl,
							title: subs[i].title							
						};
						parsedFeeds.push(feed);
						db.feeds.insert(feed);
					}
					db.users.findAndModify({
					    query: { _id: user._id },
					    update: { $set: { subscriptions: parsedSubs } },
					    new: true
					}, function(err, doc) {
					    callback([doc, {feeds: parsedFeeds}, subs]);
						console.log('modified');
					});
				}
			});
}


exports.login = login;
exports.getsubs = getsubs;