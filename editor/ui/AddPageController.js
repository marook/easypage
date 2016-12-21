app.controller('AddPageController', function($scope, modalParams, $uibModalInstance, Server, $q, ErrorHandler, StringUtils){
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
                const addFunctionName = `add${StringUtils.toFirstUpper(modalParams.pageCategory)}`;
                return Server[addFunctionName]($scope.pageTitle);
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
