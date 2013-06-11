var parser = require('xml2json'),
FeedParser = require('feedparser'),
request = require('request');

function getfeed(req, res){
	console.log("handling /getfeed");
	request(req.query.url)
	  .pipe(new FeedParser())
	  .on('error', function(error) {
	    console.log(error);
	  })
	  .on('complete', function (meta, articles) {
	    res.send(articles);
	  })
	  .on('end', function () {
	   console.log('parsing done');
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
exports.echo = echo;
exports.error404 = error404;