var parser = require('xml2json'),
  FeedParser = require('feedparser'),
  request = require('request'),
  db = require('mongojs').connect('mydb', ['feeds']),
  googleapis = require('googleapis'),
  client_id = '90018158841.apps.googleusercontent.com',
  client_secret = 'K9HzQVn1PATjX5LgQOsaXs40',
  oauth2Client = new googleapis.OAuth2Client(client_id, client_secret, 'http://localhost:3000/googleoauth');

function googleoauth(req, res){
	console.log('handling /getsubs');
	if (!req.query.code) {
		var url = oauth2Client.generateAuthUrl({
			approval_prompt: 'force',
			access_type: 'offline',
			scope: 'https://www.googleapis.com/auth/userinfo.profile https://www.google.com/reader/api'
		});
		res.redirect(url);
	}
	else {
		oauth2Client.getToken(req.query.code, function(err, tokens) {
			req.session.google = tokens;
			res.redirect('/');
		});
	}
}

function getroot(req, res){
	console.log('handling /');

	//pre-load google OAuth for myself to test
	var googleInfo = { 
		access_token: 'ya29.AHES6ZRZUSljpdcYu98ZzLXkaj1e7vEgKmacBIYty2qyMA',
		token_type: 'Bearer',
		expires_in: 3600,
		id_token: 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjMxZGVmMTc2NzhiYzViNTdiODgxNWI3MmNjNTBkM2NjZjFkMzkwNWMifQ.eyJpc3MiOiJhY2NvdW50cy5nb29nbGUuY29tIiwiY2lkIjoiOTAwMTgxNTg4NDEuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJhenAiOiI5MDAxODE1ODg0MS5hcHBzLmdvb2dsZXVzZXJjb250ZW50LmNvbSIsInRva2VuX2hhc2giOiJ3bnlZZnN3NWhGNnhVODI0ZWhGek5BIiwiYXRfaGFzaCI6IndueVlmc3c1aEY2eFU4MjRlaEZ6TkEiLCJhdWQiOiI5MDAxODE1ODg0MS5hcHBzLmdvb2dsZXVzZXJjb250ZW50LmNvbSIsImlkIjoiMTE1Nzk1ODE5NzM5Nzc2NTc0NDk0Iiwic3ViIjoiMTE1Nzk1ODE5NzM5Nzc2NTc0NDk0IiwiaWF0IjoxMzcxMDY5NDcwLCJleHAiOjEzNzEwNzMzNzB9.CHJ6ApWA-DyzubMPdts14QX3d_4LVSpTygDhjSoK3kjqR35crLk26Y5c4pLlAxFPRwxS8qdtd_kzD56dpezRFHIxqSwbxo2S0ZdbQ6HB2N5EbbLATYRMWLFVLKDQYOmbSKfIaRYNIxRWCxdPEKIFq30CaGcuH4fRBJztegC6Vdc',
		refresh_token: '1/fIemM5RkGatGgjxm5_S5rMcDDIdTBJH0V8XEO5TrcQQ'
	};
	req.session.google = googleInfo;
	
	if (!req.session.google){
		googleoauth(req, res);
	}
	else {
		res.redirect('/roreader.html');
	}
}

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
			console.log(feed.length);
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

exports.googleoauth = googleoauth;
exports.getroot = getroot;
exports.getfeed = getfeed;
exports.importsubs = importsubs;
exports.getsubs = getsubs;
exports.echo = echo;
exports.error404 = error404;