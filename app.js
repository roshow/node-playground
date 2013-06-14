var express = require('express'),
  handler = require('./handler.js'),
  app = express();

app.use(express.cookieParser());
app.use(express.session({secret: 'roreaderblahblahblah'}));

app.use(express.static(__dirname + '/public'));

app.get('/', handler.getroot);
//app.get('/importsubs', handler.importsubs_opml);
app.get('/getsubs', handler.getsubs);
app.get('/getfeed', handler.getfeed);
app.get('/echo', handler.echo);
app.get('/googleoauth', handler.googleoauth);
app.get('/logout', function(req, res){
	req.session.google = null;
	res.send("logged out");
});
app.get('*', handler.error404);

app.listen(3000);
console.log("roreader Listening on port 3000");