app.controller('LoginController', function($q, Server, $scope, $state, ErrorHandler){
    function main(){
        initScope();
    }

    function initScope(){
        $scope.invalidLoginCredentials = false;
        $scope.username = '';
        $scope.password = '';

        $scope.login = login;
    }

    function login(){
        $scope.invalidLoginCredentials = false;
        return $q.when()
            .then(function(){
                return Server.login($scope.username, $scope.password);
            })
            .then(function(){
                return $state.go('site');
            })
            .catch(function(e){
                $scope.invalidLoginCredentials = (e === 'INVALID_LOGIN_CREDENTIALS');
                if(!$scope.invalidLoginCredentials){
                    return $q.reject(e);
                }
            })
            .catch(ErrorHandler.handleError);
    }

    main();
});
