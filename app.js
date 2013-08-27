/*Check for config file first!*/

try { CONFIG = require('./config.js'); }
catch(e){ CONFIG = require('./config_example.js'); }
CONFIG.google.redirect = process.env.PORT ? CONFIG.google.redirect : CONFIG.google.redirect_local;


/*Now load stuff*/

var express = require('express'),
  handler = require('./handler.js').handler,
  app = express(),
  MongoStore = require('connect-mongo')(express),
  port = process.env.PORT || '3000';

/*Start cookie*/

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

/*Router*/

app.set('views', __dirname + '/views');
app.use(express.static(__dirname + '/public'));
app.get('/', handler.getroot);
app.get('/getsubs', handler.getsubs);
app.get('/getarticles', handler.getarticles);
app.get('/googleoauth', handler.googleoauth);
app.get('/logout', handler.logout);
app.get('/importopml', handler.importopml);
app.get('/refreshtoken', handler.refreshToken);
app.get('/updatearticle', handler.updatearticle);
app.get('/loginGeneric', handler.loginGeneric);

/*Start listening*/

app.listen(port);
console.log("roreader Listening on port " + port);