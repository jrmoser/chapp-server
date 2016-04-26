(function () {
  'use strict';

  angular.module('ChatDetailController', ['firebaseData'])

    .controller('ChatDetailController', ChatDetailController)
    .directive('setFocus', setFocus);

  ChatDetailController.$inject = ['firebaseData', '$ionicScrollDelegate'];
  setFocus.$inject = ['$ionicScrollDelegate'];

  function ChatDetailController(firebaseData) {

    var cdc = this;
    cdc.send = send;
    cdc.loggedIn = firebaseData.loggedInUser.username;
    cdc.messages = firebaseData.getCurrentMessages();
    cdc.room = firebaseData.getCurrentRoom();

    function send(message) {
      if (cdc.message) {
        firebaseData.addMessage(message);
        cdc.message = '';
      }
    }
  }

  function setFocus($ionicScrollDelegate) {
    return {
      scope: {setFocus: '='},
      link: function (scope) {
        if (scope.setFocus) $ionicScrollDelegate.scrollBottom();
      }
    };
  }


}());
