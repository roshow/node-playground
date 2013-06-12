var express = require('express'),
handler = require('./handler.js'),
goauth = require('./goauth.js');

var app = express();
app.use(express.cookieParser());
app.use(express.session({secret: 'rolipoli'}));

app.use(express.static(__dirname + '/public'));

app.get('/importsubs', handler.importsubs);
app.get('/getsubs', handler.getsubs);
app.get('/getfeed', handler.getfeed);
app.get('/echo', handler.echo);
app.get('/googleoauth', handler.googleoauth);
app.get('/google', function(req, res){
	res.send('google oauth worked <br />' + JSON.stringify(req.session.google));
});
app.get('*', handler.error404);

app.listen(3000);
console.log("roreader Listening on port 3000");