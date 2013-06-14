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
				tokens: user.tokens,
				refresh_token: user.refresh_token || null
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
	db.users.find({
		email: user.email
	}, function(err, doc) {
		if (doc[0].subscriptions) {
			console.log('subs exist');
			callback(doc[0].subscriptions);
		}
		else {
			console.log('no subs');
			var reqOpt = {
				url: 'https://www.google.com/reader/api/0/subscription/list',
				qs: {
					output: 'json',
					access_token: doc[0].tokens.access_token,
					token_type: doc[0].tokens.token_type
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
						parsedFeeds = [];
					for(i = 0; i < L; i++){
						console.log(subs[i]);
						parsedSubs.push({
							id: subs[i].id,
							tags: []
						});
						parsedFeeds.push({
							id: subs[i].id,
							xmlUrl: subs[i].id.substring(subs[i].id.indexOf('http')),
							htmlUrl: subs[i].htmlUrl,
							title: subs[i].title							
						});
					}
					//console.log(parsedSubs);
					callback({subscriptions: parsedSubs, feeds: parsedFeeds});
					/*
					db.users.findAndModify({
					    query: { _id: doc[0]._id },
					    update: { $set: { subscriptions: parsedSubs } },
					    new: true
					}, function(err, doc) {
						console.log('modified');
					    callback(doc);
					});*/
				}
			});
		}
	});
}


exports.login = login;
exports.getsubs = getsubs;