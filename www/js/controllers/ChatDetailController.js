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

//uses promises to get the current data on load of the controller
    firebaseData.getCurrentMessages().then(function(res){
      cdc.messages = res;
    });
    firebaseData.getCurrentRoom().then(function(res){
      cdc.room = res[0];
    });

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
