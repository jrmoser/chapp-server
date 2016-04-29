(function () {
  'use strict';

  angular.module('ChatDetailController', ['firebaseData'])

    .controller('ChatDetailController', ChatDetailController)
    .directive('setFocus', setFocus);

  ChatDetailController.$inject = ['firebaseData', '$scope'];
  setFocus.$inject = ['$ionicScrollDelegate'];

  function ChatDetailController(firebaseData, $scope) {

    var cdc = this;
    cdc.send = send;
    cdc.loggedIn = firebaseData.loggedInUser.username;
    cdc.socket = firebaseData.socket;

    //uses promises to get the current data on load of the controller
    firebaseData.getCurrentMessages().then(function(res){
      cdc.messages = res;
    });
    firebaseData.getCurrentRoom().then(function(res){
      cdc.room = res[0];
    });

    //socket checks
    cdc.socket.on('messageSent', function(data){
      $scope.$apply(function(){
        cdc.messages = data;
      });
    })

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
