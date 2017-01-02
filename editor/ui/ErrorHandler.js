app.factory('ErrorHandler', function($log, $q, uibModal){
    function handleError(error){
        return $q.when()
            .then(function(){
                $log.error(error);
                showErrorModal(error);
            })
            .then(function(){
                return $q.reject(error);
            });
    }

    function showErrorModal(error){
        return $uibModal.open({
            templateUrl: 'errorModal.html',
            controller: function($scope){
                $scope.error = error;
            },
        });
    }
    
    return {
        handleError,
    };
});
