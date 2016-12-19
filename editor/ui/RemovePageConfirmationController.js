app.controller('RemovePageConfirmationController', function($scope, modalParams, $uibModalInstance){
    function main(){
        initScope();
    }

    function initScope(){
        $scope.page = modalParams.page;

        $scope.removePage = removePage;
        $scope.cancel = cancel;
    }

    function removePage(){
        return $uibModalInstance.close();
    }

    function cancel(){
        return $uibModalInstance.dismiss();
    }

    main();
});
