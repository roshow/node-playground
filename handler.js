var parser = require('xml2json'),
FeedParser = require('feedparser'),
request = require('request');

var Db = require("mongojs");
var databaseUrl = "mydb"; // "username:password@example.com/mydb"
var collections = ["feeds"];
var db = Db.connect(databaseUrl, collections);

function getfeed(req, res){
	console.log('handling /getfeed');
	request(req.query.url)
	  .pipe(new FeedParser())
	  .on('error', function(error) {
	    console.log(error);
	  })
	  .on('complete', function (meta, articles) {
	    res.send([meta, articles]);
	  })
	  .on('end', function () {
	   console.log('parsing done');
	  });
}

function importsubs(req, res){
	console.log('handling /importsubs');
	request('http://localhost:3000/subscriptions.xml', function(error, response, body){
		var feedsJson = JSON.parse(parser.toJson(body));
		var subs = feedsJson.opml.body.outline;
		var L = subs.length,
		L2, innerSubs, j, i;
		for (i = 0; i < L; i++) {
			if (subs[i].outline) {
				innerSubs = (subs[i].outline instanceof Array) ? subs[i].outline : [ subs[i].outline ];
				L2 = innerSubs.length;
				for (j = 0; j < L2; j++) {
					db.feeds.save(innerSubs[j]);
				}
			}
			else {
				db.feeds.save(subs[i]);
			}
		}
		db.feeds.find({}, function(err, feed){
			res.send(feed);
		});
	});
}

function getsubs(req, res){
	console.log('handling /getsubs');
	db.feeds.find({}, function(err, feed){
		if (feed.length === 0){
			importsubs(req, res);
		}
		else {
			res.send(feed);
		}
	});
}

function echo(req, res){
	console.log("handling /echo");
	res.send('echo ' + JSON.stringify(req.query));
}

function error404(req, res){
	console.log("handling *");
	res.send("404 Error. This path doesn't exist.", 404);
}

exports.getfeed = getfeed;
exports.importsubs = importsubs;
exports.getsubs = getsubs;
exports.echo = echo;
exports.error404 = error404;