var express = require('express');
var http = require('http');
var app = express();
var server = http.createServer(app);
var io = require('socket.io').listen(server);

var MongoClient = require('mongodb').MongoClient;
var url = 'mongodb://admin:admin@ds021771.mlab.com:21771/chapp';

var bodyParser = require('body-parser');
var assert = require('assert');

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

app.use('/', express.static(__dirname + '/../www'));
app.use('/node_modules', express.static(__dirname + '/node_modules'));


io.on('connection', function (socket) {
  console.log("socket opened");
});


var rooms = [];

var findRooms = function(db, callback) {
  db.collection('rooms').find().toArray(function(err, docs) {
    assert.equal(err, null);
    rooms = docs;
    callback(docs);
  });
};

var addRoom = function(db, room, callback) {
  db.collection('rooms').insertOne(room, function(err, result) {
    assert.equal(err, null);
    console.log("Inserted a room into the rooms collection.");
    callback();
  });
};


app.get('/api/rooms', (req, res) => {
  res.json(rooms).end();
});

app.post('/api/rooms', (req, res) => {
  MongoClient.connect(url, function(err, db) {
    assert.equal(null, err);
    addRoom(db, req.body, function() {
      findRooms(db, function() {
        res.json(rooms).end();
        db.close();
      });
    });
  });
});

var port = 5000;
server.listen(port, function() {
  console.log(`App listening on port ${port}...`);
});
