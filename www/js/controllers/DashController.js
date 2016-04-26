(function () {
  'use strict';

  angular.module('DashController', ["firebaseData"])

    .controller('DashController', DashController);

  DashController.$inject = ['firebaseData'];

  function DashController(firebaseData) {
    var dc = this;
    dc.messages = firebaseData.getGeneralChat();
  }

}());
