var db = require('mongojs').connect('mydb', ['feeds', 'users', 'feedex']),
	request = require('request');

function googleoauth(err, user, callback) {
	console.log('db googleoauth');
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
				tokens: user.tokens
			};
			db.users.save(newUser, function(err, save) {
				importsubs(newUser, callback);
			});
		}
		else {
			console.log('user exists');
			db.users.findAndModify({
				query: { _id: entry[0]._id },
				update: { $set: { tokens: user.tokens } }
			});
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

function importsubs(user, callback){
	console.log('db importsubs');
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
				parsedTags = [{
					tag: 'Uncategorized',
					id: user._id + '/Uncategorized'
				}],
				i, tagObj, tagId;
			var checktags = function(e){ 
				return (e.tag === this.label); 
			};
			for(i=0;i < L;i++){
				if (subs[i].categories.length > 0) {
					tagObj = subs[i].categories[0];
					tagId = user._id + '/' + tagObj.label;
					if (!parsedTags.some(checktags, tagObj)) {
						parsedTags.push({
							tag: tagObj.label,
							id: tagId
						});
					}
				}
				else {
					tagId = user._id + '/Uncategorized';
				}
				parsedSubs.push({
					id: subs[i].id,
					tags: [tagId]
				});
				var feed = {
					_id: subs[i].id,
					xmlUrl: subs[i].id.substring(subs[i].id.indexOf('http')),
					htmlUrl: subs[i].htmlUrl,
					title: subs[i].title							
				};
				db.feeds.insert(feed);
			}
			db.users.findAndModify({
			    query: { _id: user._id },
			    update: { $set: { subscriptions: parsedSubs, tags: parsedTags } },
			    new: true
			}, function(err, doc) {
			    callback(doc);
			});
		}
	});
}


exports.googleoauth = googleoauth;
exports.getsubs = getsubs;
exports.importsubs = importsubs;