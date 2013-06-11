var express = require('express'),
handler = require('./handler.js');

var app = express();

app.use(express.static(__dirname + '/public'));

app.get('/importsubs', handler.importsubs);
app.get('/getsubs', handler.getsubs);
app.get('/getfeed', handler.getfeed);
app.get('/echo', handler.echo);
app.get('*', handler.error404);

app.listen(3000);
console.log("roreader Listening on port 3000");