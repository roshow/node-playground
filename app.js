try { CONFIG = require('./config.js'); }
catch(e){ CONFIG = require('./config_example.js'); }

var express = require('express'),
  handler = require('./handler.js').handler,
  app = express(),
  MongoStore = require('connect-mongo')(express);

app.use(express.cookieParser());
app.use(express.session({
  store: new MongoStore({
    db: CONFIG.mongo.db,
    host: CONFIG.mongo.host,
    port: CONFIG.mongo.port,
    username: CONFIG.mongo.username,
    password: CONFIG.mongo.password
  }),
  secret: CONFIG.session.secret
}));

app.use(express.static(__dirname + '/public'));
app.get('/play', handler.play);

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

app.listen(3000);
console.log("roreader Listening on port 3000");