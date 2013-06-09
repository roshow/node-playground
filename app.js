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

	if (req && req.query.url !== "") {

		var feedURL = url.parse(req.query.url);

		var httpOpts = {
			host: feedURL.host,
			path: feedURL.path,
			method: "GET" 
		};

		var httpCB = function(response){
			var str = '';
			response.on('data', function (chunk) {
				str += chunk;
			});
			response.on('end', function(){
				json = parser.toJson(str);
				res.send(JSON.stringify(json), 200);
			});
		};

		//make request, handle error and end request.
		var request = http.request(httpOpts, httpCB);
		request.on('error', function(e) { res.send('problem with request: ' + e.message); });
		request.end();
	}
	else {
		res.send("");
	}
});

app.get('*', function(req, res){
  res.send("404 Error. This path doesn't exist.", 404);
});

app.listen(3000);
console.log("Listening on port 3000");