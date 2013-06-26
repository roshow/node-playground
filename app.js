var express = require('express'),
  handler = require('./handler.js').handler,
  app = express(),
  MongoStore = require('connect-mongo')(express),
  secrets = require('./secrets.js').secrets;

app.use(express.cookieParser());
app.use(express.session({
  store: new MongoStore({
    db: secrets.mongo.db || 'localrodb',
    host: secrets.mongo.host || null,
    port: secrets.mongo.port || null,
    username: secrets.mongo.username || null,
    password: secrets.mongo.password || null
  }),
  secret: 'roreader2389042304987'
}));

app.use(express.static(__dirname + '/public'));

app.get('/', handler.getroot);
app.get('/getsubs', handler.getsubs);
app.get('/getfeed', handler.getfeed);
app.get('/echo', handler.echo);
app.get('/googleoauth', handler.googleoauth);
app.get('/logout', function(req, res){
	req.session.user = null;
	res.redirect('/');
});
app.get('/importopml', handler.importopml);
app.get('/refreshtoken', handler.refreshToken);

app.listen(process.env.PORT || 3000);
console.log("roreader Listening on port 3000");