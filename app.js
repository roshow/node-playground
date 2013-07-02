try { _config = require('./config.js'); }
catch(e){ _config = require('./config_example.js'); }
_config.google.redirect = process.env.PORT ? _config.google.redirect : _config.google.redirect_local;


var express = require('express'),
  handler = require('./handler.js').handler,
  app = express(),
  MongoStore = require('connect-mongo')(express),
  port = process.env.PORT || '3000';

app.use(express.cookieParser());
app.use(express.session({
  store: new MongoStore({
    db: _config.mongo.db,
    host: _config.mongo.host,
    port: _config.mongo.port,
    username: _config.mongo.username,
    password: _config.mongo.password
  }),
  secret: _config.session.secret
}));

app.use(express.static(__dirname + '/public'));

app.get('/', handler.getroot);
app.get('/getsubs', handler.getsubs);
app.get('/getarticles', handler.getarticles);
app.get('/googleoauth', handler.googleoauth);
app.get('/logout', function(req, res){
	req.session.user = null;
  req.session.feed = null;
	res.redirect('/');
});
app.get('/importopml', handler.importopml);
app.get('/refreshtoken', handler.refreshToken);
app.get('/updatearticle', handler.updatearticle);

app.listen(port);
console.log("roreader Listening on port " + port);