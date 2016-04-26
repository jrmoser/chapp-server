(function () {
  'use strict';

  angular.module('ChatsController', ['firebaseData'])

    .controller('ChatsController', ChatsController);

  ChatsController.$inject = ['$scope', '$ionicPopup', 'firebaseData', '$http'];

  function ChatsController($scope, $ionicPopup, firebaseData, $http) {

    var cc = this;
    cc.addRoom = addRoom;
    cc.addRoomPopup = addRoomPopup;
    cc.loggedIn = firebaseData.loggedInUser.username;
    cc.chatRooms = firebaseData.rooms;

    function addRoom(name, desc) {
      firebaseData.addRoom(name, desc);
      cc.desc = '';
      cc.name = '';
    }

    cc.uploadFile = function (files) {
      var fd = new FormData();
      //Take the first selected file
      fd.append("file", files[0]);

      $http.post(uploadUrl, fd, {
        withCredentials: true,
        headers: {'Content-Type': undefined},
        transformRequest: angular.identity
      }).success('...all right!...').error('..no!...');

    };


    function addRoomPopup() {
      $ionicPopup.prompt({
        title: 'Add a room that doesn\'t already exist',
        templateUrl: 'add-chat-room.html',
        //didn't want to, but this requires that I have the $scope used to make this work properly
        scope: $scope,
        buttons: [
          {
            text: 'Cancel',
            type: 'button-default'
          },
          {
            text: 'Add',
            type: 'button-balanced',
            onTap: function () {
              if (cc.name && cc.desc) {
                cc.addRoom(cc.name, cc.desc);
              }
            }
          }]
      });
    }
  }


}());
