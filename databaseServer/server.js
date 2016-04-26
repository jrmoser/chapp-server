var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var fs = require('fs');
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var url = 'mongodb://admin:admin@ds021771.mlab.com:21771/chapp';

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

app.use('/', express.static(__dirname + '/client'));
app.use('/node_modules', express.static(__dirname + '/node_modules'));

var rooms = [];

var findRooms = function(db, callback) {
  db.collection('rooms').find().toArray(function(err, docs) {
    assert.equal(err, null);
    rooms = docs;
    callback(docs);
  });
};

var removeMovie = function(db, movie, callback) {
  db.collection('movies').deleteOne({
      "title": movie
    },
    function(err, result) {
      assert.equal(err, null);
      assert.equal(1, result.result.n);
      callback();
    }
  );
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

var port = process.env.PORT || 5000;
app.listen(port, function() {
  console.log(`App listening on port ${port}...`);
});
