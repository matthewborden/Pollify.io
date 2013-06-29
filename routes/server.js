var http = require('http');
var backboneio = require('backbone.io');

var app = http.createServer();    
app.listen(3000);

var currentBackend = backboneio.createBackend();
backend.use(backboneio.middleware.memoryStore());

backboneio.listen(app, { mybackend: currentBackend });