(function () {
  'use strict';

  angular.module('DashController', ["firebaseData"])

    .controller('DashController', DashController);

  DashController.$inject = ['firebaseData'];

  function DashController(firebaseData) {
    var dc = this;
    firebaseData.getGeneralChat().then(function(res){
      dc.messages = res;
    });
  }

}());
