try { _config = require('./config.js'); }
catch(e){ _config = require('./config_example.js'); }

var express = require('express'),
  handler = require('./handler.js').handler,
  app = express(),
  MongoStore = require('connect-mongo')(express);

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

app.listen(3000);
console.log("roreader Listening on port 3000");