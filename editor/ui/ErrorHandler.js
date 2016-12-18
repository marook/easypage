app.factory('ErrorHandler', function($log){
    function handleError(error){
        $log.error(error);
        showErrorModal(error);
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
