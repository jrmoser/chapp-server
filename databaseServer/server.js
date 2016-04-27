var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var fs = require('fs');
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var url = 'mongodb://54.186.218.180:27017';

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

app.use('/', express.static(__dirname + '/../www'));
app.use('/node_modules', express.static(__dirname + '/node_modules'));

var findRooms = function(db, callback) {
    db.collection('rooms').find().toArray(function(err, docs) {
        assert.equal(err, null);
        movies = docs;
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


app.get('/api/movies', (req, res) => {
    res.json(movies).end();
});

app.get('/api/movies/search', (req, res) => {
    var results = [];
    movies.forEach(movie => {
        if (movie.title.includes(req.query.contains)) {
            results.push(movie);
        }
    })
    res.json(results).end();
});

app.post('/api/movies', (req, res) => {
    MongoClient.connect(url, function(err, db) {
        assert.equal(null, err);
        insertMovie(db, req.body, function() {
            findMovies(db, function() {
                res.json(movies).end();
                db.close();
            });
        });
    });
});

app.put('/api/movies', (req, res) => {
    MongoClient.connect(url, function(err, db) {
        assert.equal(null, err);
        removeMovie(db, req.body.title, function() {
            findMovies(db, function() {
                res.json(movies).end();
                db.close();
            });
        });
    });
});

app.put('/api/movies/checkOut', (req, res) => {
    movies.forEach((movie, index) => {
        if (movie.title === req.body.title) {
            movie.checkedOut = true;
        }
    });
    save();
    res.json(movies).end();
});

app.put('/api/movies/return', (req, res) => {
    movies.forEach((movie, index) => {
        if (movie.title === req.body.title) {
            movie.checkedOut = false;
        }
    });
    save();
    res.json(movies).end();
});

var port = process.env.PORT || 5000;
app.listen(port, function() {
    console.log(`App listening on port ${port}...`);
});
