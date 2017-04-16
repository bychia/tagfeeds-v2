var express = require('express')
var app = express();
var request = require('request');
app.use(express.static('static'));

app.get('/proxy', function(req, res){
  var url = req.query.url;
  request('http://localhost:3800/?url='+url, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      res.send(body)
    }
  });
});

var server = app.listen(3000, function() {
	var port = server.address().port;
	console.log("Started server at port", port);
});
