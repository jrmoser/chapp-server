(function () {
  'use strict';

  angular.module('firebaseData', [
    'firebase',
    'ngStorage'
  ])

    .service('firebaseData', firebaseData);

  firebaseData.$inject = ['$firebaseArray', '$location', '$firebaseObject', '$localStorage', '$http', '$q'];

  function firebaseData($firebaseArray, $location, $firebaseObject, $localStorage, $http, $q) {

    //put firebase at the top to be used in declarations area
    var ref = new Firebase("https://firechatmlatc.firebaseio.com/");
    var messages = ref.child("/messages");
    var rooms = ref.child("/rooms");
    var users = ref.child("/users");

    //Define all variables and functions usable to other controllers
    var fb = this;
    fb.objectRef = $firebaseObject(ref);
    fb.rooms = $firebaseArray(rooms);
    fb.loggedInUser = {name: '', username: '', uid: '', email: '', profilePic: ''};
    fb.loginError = false;
    fb.registerError = false;
    fb.errorMessage = "Something has gone terribly wrong";
    fb.addMessage = addMessage;
    fb.getCurrentMessages = getCurrentMessages;
    fb.getCurrentRoom = getCurrentRoom;
    fb.addRoom = addRoom;
    fb.login = login;
    fb.FBlogin = FBlogin;
    fb.Googlelogin = Googlelogin;
    fb.register = register;
    fb.logout = logout;
    fb.loadUser = loadUser;
    fb.getGeneralChat = getGeneralChat;
    loadUser();

    function addMessage(message) {
      var currentRoomMessages = getCurrentMessages();
      currentRoomMessages.$add({
        content: message,
        timeStamp: new Date().getTime(),
        from: fb.loggedInUser.username,
        profilePic: fb.loggedInUser.profilePic
      });
    }

    function addRoom(name, desc) {
      fb.objectRef.rooms[name] = {
        name: name,
        desc: desc,
        face: avatarGen()
      };
      fb.objectRef.$save();
    }

    function getCurrentMessages() {
      var temp = messages.child(activeRoom());
      return $firebaseArray(temp);
    }

    function getCurrentRoom() {
      var temp = rooms.child(activeRoom());
      return $firebaseObject(temp);
    }

    //functions used only inside of the service go here

    function activeRoom() {
      var completeURL = $location.url();
      var lastSlash = completeURL.lastIndexOf('/');
      var currRoom = completeURL.substr(lastSlash);
      return decodeURI(currRoom);
    }

    function getGeneralChat() {
      var temp = messages.child("/General Chat");
      return $firebaseArray(temp);
    }

    //User authentication functions
    function login(email, password) {
      //Authenticates user by email and password
      var ref = new Firebase("https://firechatmlatc.firebaseio.com");
      return ref.authWithPassword({
        email: email,
        password: password
      }, function (error, authData) {
        if (error) {
          console.log("You broke it");
          fb.loginError = true;
          console.log("Login Failed!", error);
          fb.errorMessage = error.message;
        } else {
          fb.loginError = false;
          fb.loggedInUser.email = authData.password.email;
          fb.loggedInUser.uid = authData.uid;
          fb.loggedInUser.username = fb.objectRef.users[authData.uid].username;
          fb.loggedInUser.name = fb.objectRef.users[authData.uid].name;
          fb.loggedInUser.profilePic = fb.objectRef.users[authData.uid].profileURL;
          saveUser(fb.loggedInUser);
          console.log("Logged in as " + fb.loggedInUser.username + ": Firebase Service");

        }
      });
    }


    function FBlogin() {
      var ref = new Firebase("https://firechatmlatc.firebaseio.com");
      return ref.authWithOAuthPopup("facebook", function (error, authData) {
        if (error) {
          fb.loginError = true;
          console.log("Login Failed!", error);
          fb.errorMessage = error.message;
        } else {
          fb.loginError = false;
          fb.loggedInUser.username = authData.facebook.displayName;
          fb.loggedInUser.uid = authData.uid;
          fb.loggedInUser.profilePic = authData.facebook.profileImageURL;
          console.log("Authenticated successfully with payload:", authData);
          saveUser(fb.loggedInUser);
        }
      });
    }

    function Googlelogin() {
      var ref = new Firebase("https://firechatmlatc.firebaseio.com");
      return ref.authWithOAuthPopup("google", function (error, authData) {
        if (error) {
          fb.loginError = true;
          console.log("Login Failed!", error);
          fb.errorMessage = error.message;
        } else {
          fb.loginError = false;
          fb.loggedInUser.username = authData.google.displayName;
          fb.loggedInUser.uid = authData.uid;
          fb.loggedInUser.profilePic = authData.google.profileImageURL;
          console.log("Authenticated successfully with payload:", authData);
          saveUser(fb.loggedInUser);
        }
      });
    }

    function register(firstname, lastname, email, username, password) {
      var ref = new Firebase("https://firechatmlatc.firebaseio.com/users");
      return ref.createUser(
        {
          email: email,
          password: password

        }, function (error, userData) {
          if (error) {
            fb.registerError = true;
            console.log("Error creating user:" + error);
            fb.errorMessage = error.message;
          } else {
            fb.registerError = false;
            console.log("Successfully created user account with uid:", userData.uid);
            var ref = new Firebase("https://firechatmlatc.firebaseio.com");
            ref.authWithPassword({
              email: email,
              password: password
            }).then(function () {
              ref = new Firebase("https://firechatmlatc.firebaseio.com/users/" + userData.uid);
              ref.set(
                {
                  username: username,
                  name: firstname + " " + lastname,
                  profileURL: avatarGen()
                }
              );
            });
          }
        });
    }

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

    function logout() {
      var ref = new Firebase("https://firechatmlatc.firebaseio.com");
      ref.unauth();
      fb.loggedInUser = {name: '', username: '', uid: '', email: ''};
      delete $localStorage.loggedInUser;
      console.log("User was logged out!");
    }

    function saveUser(userdata) {
      $localStorage.loggedInUser = userdata;
      console.log("User information saved. " + userdata.username);
    }

    function loadUser() {
      if ($localStorage.loggedInUser) {
        fb.loggedInUser = $localStorage.loggedInUser;
        console.log("Username: " + fb.loggedInUser.username + " ProfilePic: " + fb.loggedInUser.profilePic + " UID: " + fb.loggedInUser.uid);
      }
    }

  }

}());
