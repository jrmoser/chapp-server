(function () {
  'use strict';

  angular.module('AccountController', ['firebaseData'])
    // .directive('validateEmail', function () {
    //   var EMAIL_REGEXP = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/;
    //
    //   return {
    //     require: 'ngModel',
    //     restrict: 'A',
    //     link: function (scope, element, attrs, ctrl) {
    //       // only apply the validator if ngModel is present AND Angular has added the email validator
    //       if (ctrl && ctrl.$validators.email) {
    //         //overwrites the default Angular email validator
    //         ctrl.$validators.email = function (modelValue) {
    //           return ctrl.$isEmpty(modelValue) || EMAIL_REGEXP.test(modelValue);
    //         }
    //       }
    //     }
    //   };
    // })
    .controller('AccountController', AccountController);

  AccountController.$inject = ['$scope', 'firebaseData', '$timeout', '$q'];

  function AccountController($scope, firebaseData, $timeout, $q) {

    var ac = this;

    ac.profilePic= "";
    ac.FBlogin = FBlogin;
    ac.logout = logout;
    ac.loginError = false;
    ac.registerError = false;
    ac.errorMessage = ":'(";

    function FBlogin() {
      console.log('FB Login');
      firebaseData.FBlogin().then(function () {
        ac.username = firebaseData.loggedInUser.username;
        ac.profilePic = firebaseData.loggedInUser.profilePic;
        $timeout(function () {
          ac.state = ac.username ? "loggedin" : "login";
        });
      });
    }


    function logout() {
      firebaseData.logout();
      ac.state = "login";
      ac.username = "";
    }


    ac.togglereg = function () {
      if (ac.state == "login") {
        ac.state = "reg";
      }
      else {
        ac.state = "login";
      }
    };

    FBlogin();
  }


}());
