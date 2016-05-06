var express = require('express');
var app = express();
//passport garbage
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
//socket garbage
var http = require('http');
var server = http.createServer(app);
var io = require('socket.io').listen(server);
//mongo garbage
var MongoClient = require('mongodb').MongoClient;
var url = 'mongodb://admin:admin@ds021771.mlab.com:21771/chapp';
var assert = require('assert');

app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(session({ secret: 'cookie monster',resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());
app.use('/', express.static(__dirname + '/../www'));
app.use('/node_modules', express.static(__dirname + '/node_modules'));

passport.use(new FacebookStrategy({
    clientID: "1670711609863592",
    clientSecret: "ed1fdb35da88505d0542dd1bf0258493",
    callbackURL: "http://ec2-54-186-218-180.us-west-2.compute.amazonaws.com/auth/facebook/callback",
    profileFields: ['id', 'displayName', 'photos']
  },
  function (accessToken, refreshToken, profile, done) {
    var data = {
      "_id" : profile.id,
      "profileURL": profile.photos ? profile.photos[0].value : avatarGen(),
      "username": profile.displayName,
      "provider": "facebook"
    };
    MongoClient.connect(url, function (err, db) {
      assert.equal(null, err);
      db.collection('users').findOneAndUpdate({_id: data._id}, data, {upsert: true, returnNewDocument: true});
    });
    done(null, profile);
  }
));

passport.use(new GoogleStrategy({
    clientID: "562875444406-gqas93nneaqf2gd8vnrjv1eraabdfotc.apps.googleusercontent.com",
    clientSecret: "460DzrGqfELLVobc3eojraRC",
    callbackURL: "http://ec2-54-186-218-180.us-west-2.compute.amazonaws.com/auth/google/callback",
  },
  function (accessToken, refreshToken, profile, done) {
    console.log(profile);
    var data = {
      "_id" : profile.id,
      "profileURL": profile._json ? profile._json['picture'] : './avatars/BlackAvatar.jpg',
      "username": profile.displayName,
      "provider": "google"
    };
    MongoClient.connect(url, function (err, db) {
      assert.equal(null, err);
      db.collection('users').findOneAndUpdate({_id: data._id}, data, {upsert: true, returnNewDocument: true});
    });
    done(null, profile);
  }
));

passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(function (id, done) {
  var search = { _id : id }
  MongoClient.connect(url, function (err, db) {
    assert.equal(null, err);
    find(db, 'users', search, function(data){
      done(null, data[0]);
      db.close();
    })
  });
});

app.get('/user', (req, res) => {
  console.log(req.user);
    res.json(req.user);
});

app.get('/user/logout', (req, res) => {
  req.logout();
  res.redirect('/#/tab/account');
}
);

app.get('/auth/facebook', passport.authenticate('facebook'));
app.get('/auth/facebook/callback',function(req, res, next) {
	passport.authenticate('facebook', function(err, user, info) {
		console.log(err, user, info);
		// req.login() will save user object to session
		req.login(user, (error) => {
			if (error) {
				console.log('error login', error);
				res.redirect('/');
			} else {
				console.log('login success', user);
				res.redirect('/#/tab/account');
			}
		});
	})(req, res, next);
});

app.get('/auth/google', passport.authenticate('google', { scope: ['https://www.googleapis.com/auth/plus.login'] }));
app.get('/auth/google/callback',function(req, res, next) {
	passport.authenticate('google', function(err, user, info) {
		console.log(err, user, info);
		// req.login() will save user object to session
		req.login(user, (error) => {
			if (error) {
				console.log('error login', error);
				res.redirect('/');
			} else {
				console.log('login success', user);
				res.redirect('/#/tab/account');
			}
		});
	})(req, res, next);
});

io.on('connection', function (socket) {
  //using sockets here for posting data so that everything is super currentish
  socket.on('roomAdded', function (socketData) {
    MongoClient.connect(url, function (err, db) {
      assert.equal(null, err);
      add(db, 'rooms', socketData, function () {
        find(db, 'rooms', null, function (data) {
          socket.emit('roomSent', data);
          socket.broadcast.emit('roomSent', data);
          db.close();
        });
      });
    });
  });

  socket.on('messageAdded', function (socketData) {
    var currRoom = {room: socketData.room};
    MongoClient.connect(url, function (err, db) {
      assert.equal(null, err);
      add(db, 'messages', socketData, function () {
        find(db, 'messages', currRoom, function (data) {
          socket.emit('messageSent', data);
          socket.broadcast.emit('messageSent', data);
          db.close();
        });
      });
    });
  });
});


var find = function (db, collection, room, callback) {
  db.collection(collection).find(room).toArray(function (err, docs) {
    assert.equal(err, null);
    callback(docs);
  });
};

var add = function (db, collection, data, callback) {
  db.collection(collection).insertOne(data, function (err, result) {
    assert.equal(err, null);
    console.log(`Inserted data into the ${collection} collection.`);
    callback();
  });
};


app.get('/api/rooms', (req, res) => {
  MongoClient.connect(url, function (err, db) {
    assert.equal(null, err);
    find(db, 'rooms', null, function (data) {
      res.json(data).end();
      db.close();
    });
  });
});


app.get('/api/room:room', (req, res) => {
  var currRoom = {
    name: req.params.room.slice(1)
  };
  MongoClient.connect(url, function (err, db) {
    assert.equal(null, err);
    find(db, 'rooms', currRoom, function (data) {
      res.json(data).end();
      db.close();
    });
  });
});

app.get('/api/messages:room', (req, res) => {
  var currRoom = {
    room: req.params.room.slice(1)
  };
  MongoClient.connect(url, function (err, db) {
    assert.equal(null, err);
    find(db, 'messages', currRoom, function (data) {
      res.json(data).end();
      db.close();
    });
  });
});

//random avatar generator for if they don't have a picture from facebook or google
function avatarGen() {
  var x = Math.floor((Math.random() * 5));
  var avatar = '';
  if (x === 0) {
    avatar = './avatars/OrangeAvatar.png';
  }
  else if (x === 1) {
    avatar = './avatars/BlueAvatar.png';
  }
  else if (x === 2) {
    avatar = './avatars/RedAvatar.png';
  }
  else if (x === 3) {
    avatar = './avatars/YellowAvatar.png';
  }
  else if (x === 4) {
    avatar = './avatars/BlackAvatar.jpg';
  }
  return avatar;
}



var port = 5000;
server.listen(port, function () {
  console.log(`App listening on port ${port}...`);
});
