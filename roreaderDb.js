var db = require('mongojs').connect('rodb', ['feeds', 'users', 'tags']),
	request = require('request');

function updateAccessToken(user, token, callback){
	db.users.findAndModify({
		query: { email: user.email },
		update: { 
			$set: { 
				'tokens.access_token': token,
				'tokens.access_token_date': new Date()
			} 
		}
	}, function(e, r){
		console.log(r);
	});	
}

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
				tokens: {
					access_token: user.tokens.access_token,
					refresh_token: user.tokens.refresh_token,
					access_token_date: new Date()
				}
			};
			db.users.save(newUser, function(err, save) {
				callback(newUser);
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

function feedsInsert(feed, callback){
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
	db.tags.insert({
		_id: taginfo.userId + '/' + taginfo.tag,
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
exports.googleoauth = googleoauth;
exports.getsubs = getsubs;
exports.importsubs = importsubs;
exports.feedsInsert = feedsInsert;
exports.tagsInsert = tagsInsert;