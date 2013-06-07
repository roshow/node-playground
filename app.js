var express = require("express");
var url = require("url");
var http = require("http");
var parser = require('xml2json');


var app = express();

app.use(express.static(__dirname + "/public"));

app.get("/echo", function(req, res){
	var urlz = url.parse(req.query.url,true,true);
	res.send("echo " + JSON.stringify(urlz));
	//console.log("query req'ed");
});

app.get("/getfeed", function(req, res){

	var parsedURL = url.parse(req.query.url,true,true);
	//chaoskirby.blogspot.com/feeds/posts/default
	console.log(parsedURL);
	var httpOpts = {
		host: parsedURL.host,
		path: parsedURL.path,
		method: "GET"
	};

	var httpCB = function(response){
		var str = '';
		response.on('data', function (chunk) {
			str += chunk;
		});
		response.on('end', function(){
			res.send(str, 200);
		});
	};

	var request = http.request(httpOpts, httpCB);
	request.on('error', function(e) { res.send('problem with request: ' + e.message); });
	request.end();
});

app.get('*', function(req, res){
  res.send('404', 404);
});

app.listen(3000);
console.log("Listening on port 3000");