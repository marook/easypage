app.controller('AddPageController', function($scope, modalParams, $uibModalInstance, Server, $q, ErrorHandler){
    function main(){
        initScope();
    }

    function initScope(){
        $scope.pageTitle = modalParams.pageTitle || '';

        $scope.createPage = createPage;
        $scope.cancel = cancel;
    }

    function createPage(){
        return $q.when()
            .then(function(){
                return Server.addPage($scope.pageTitle);
            })
            .then(function(pageId){
                return $uibModalInstance.close(pageId);
            })
            .catch(ErrorHandler.handleError);
    }

    function cancel(){
        return $uibModalInstance.dismiss();
    }

    main();
});
