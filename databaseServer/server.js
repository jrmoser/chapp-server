var express = require('express');
var http = require('http');
var app = express();
var server = http.createServer(app);
var io = require('socket.io').listen(server);

var MongoClient = require('mongodb').MongoClient;
var url = 'mongodb://admin:admin@ds021771.mlab.com:21771/chapp';

var bodyParser = require('body-parser');
var assert = require('assert');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());

app.use('/', express.static(__dirname + '/../www'));
app.use('/node_modules', express.static(__dirname + '/node_modules'));

io.on('connection', function(socket) {
  //using sockets here for posting data so that everything is super currentish
  socket.on('roomAdded', function(socketData) {
    MongoClient.connect(url, function(err, db) {
      assert.equal(null, err);
      add(db, 'rooms', socketData, function() {
        find(db, 'rooms', null, function(data) {
          socket.emit('roomSent', data);
          socket.broadcast.emit('roomSent', data);
          db.close();
        });
      });
    });
  });

  socket.on('messageAdded', function(socketData) {
    var currRoom = {room: socketData.room}
    MongoClient.connect(url, function(err, db) {
      assert.equal(null, err);
      add(db, 'messages', socketData, function() {
        find(db, 'messages', currRoom, function(data) {
          socket.emit('messageSent', data);
          socket.broadcast.emit('messageSent', data);
          db.close();
        });
      });
    });
  });
});


var find = function(db, collection, room, callback) {
  db.collection(collection).find(room).toArray(function(err, docs) {
    assert.equal(err, null);
    callback(docs);
  });
};

var add = function(db, collection, data, callback) {
  db.collection(collection).insertOne(data, function(err, result) {
    assert.equal(err, null);
    console.log(`Inserted data into the ${collection} collection.`);
    callback();
  });
};


app.get('/api/rooms', (req, res) => {
  MongoClient.connect(url, function(err, db) {
    assert.equal(null, err);
    find(db, 'rooms', null, function(data) {
      res.json(data).end();
      db.close();
    });
  });
});

app.get('/api/room:room', (req, res) => {
  var currRoom = {
    name: req.params.room.slice(1)
  };
  MongoClient.connect(url, function(err, db) {
    assert.equal(null, err);
    find(db, 'rooms', currRoom, function(data) {
      res.json(data).end();
      db.close();
    });
  });
});

app.get('/api/messages:room', (req, res) => {
  var currRoom = {
    room: req.params.room.slice(1)
  };
  MongoClient.connect(url, function(err, db) {
    assert.equal(null, err);
    find(db, 'messages', currRoom, function(data) {
      res.json(data).end();
      db.close();
    });
  });
});


var port = 5000;
server.listen(port, function() {
  console.log(`App listening on port ${port}...`);
});
