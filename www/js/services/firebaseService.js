(function () {
  'use strict';

  angular.module('firebaseData', [
    'firebase',
    'ngStorage'
  ])

    .service('firebaseData', firebaseData);

  firebaseData.$inject = ['$location', '$localStorage', '$http', '$q'];

  function firebaseData($location, $localStorage, $http, $q) {

    //Define all variables and functions usable to other controllers
    var fb = this;
    fb.socket = io.connect('http://ec2-54-186-218-180.us-west-2.compute.amazonaws.com:5000');
    // fb.socket = io.connect('http://localhost:5000');
    fb.rooms = [];
    fb.loggedInUser = {name: '', username: '', uid: '', email: '', profilePic: ''};
    fb.loginError = false;
    fb.registerError = false;
    fb.errorMessage = "Something has gone terribly wrong";
    fb.addMessage = addMessage;
    fb.getCurrentMessages = getCurrentMessages;
    fb.getCurrentRoom = getCurrentRoom;
    fb.addRoom = addRoom;
    // fb.login = login;
    fb.FBlogin = FBlogin;
    // fb.register = register;
    fb.logout = logout;
    fb.loadUser = loadUser;
    fb.getGeneralChat = getGeneralChat;
    loadUser();

    $http.get('/api/rooms').then(function (res){
      fb.rooms = res.data;
    });

    function addMessage(message) {
      var data = {
        content: message,
        timeStamp: new Date().getTime(),
        from: fb.loggedInUser.username,
        room: activeRoom(),
        profilePic: fb.loggedInUser.profilePic
      };
        fb.socket.emit('messageAdded', data);
    }

    function addRoom(name, desc) {
     var data = {
        name: name,
        desc: desc,
        face: avatarGen()
      };
        fb.socket.emit('roomAdded', data);
    }

    function getCurrentMessages() {
      var url = '/api/messages:' + activeRoom();
      return $http.get(url).then(function (res){
        return res.data;
      });
    }

    function getCurrentRoom() {
      var url = '/api/room:' + activeRoom();
      return $http.get(url).then(function (res){
        return res.data;
      });
    }

    //functions used only inside of the service go here

    function activeRoom() {
      var completeURL = $location.url();
      var lastSlash = completeURL.lastIndexOf('/');
      var currRoom = completeURL.substr(lastSlash + 1);
      return decodeURI(currRoom);
    }

    function getGeneralChat() {
      var url = '/api/messages:General Chat';
      return $http.get(url).then(function (res){
        return res.data;
      });
    }

    function FBlogin() {
      return $http.get('/user').then(function (res) {
        if (res.data) {
          fb.loginError = false;
          fb.loggedInUser.username = res.data.username;
          fb.loggedInUser.uid = res.data._id;
          fb.loggedInUser.profilePic = res.data.profileURL;
          console.log("Authenticated successfully with payload:", res.data);
        } else {
          fb.loginError = true;
        }
      });
    }

    function logout() {
      fb.loggedInUser = {name: '', username: '', uid: '', email: ''};
      console.log("User was logged out!");
      return $http.get('/user/logout')
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
