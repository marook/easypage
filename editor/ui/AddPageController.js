app.controller('AddPageController', function($scope, modalParams, $uibModalInstance, Server, $q, ErrorHandler){
    function main(){
        initScope();
    }

    function initScope(){
        $scope.creatingPage = false;
        $scope.pageTitle = modalParams.pageTitle || '';

        $scope.createPage = createPage;
        $scope.cancel = cancel;
    }

    function createPage(){
        $scope.creatingPage = true;
        return $q.when()
            .then(function(){
                return Server.addPage($scope.pageTitle);
            })
            .then(function(pageId){
                return $uibModalInstance.close(pageId);
            })
            .catch(ErrorHandler.handleError)
            .finally(function(){
                $scope.creatingPage = false;
            });
    }

    function cancel(){
        return $uibModalInstance.dismiss();
    }

    main();
});
