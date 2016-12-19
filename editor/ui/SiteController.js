app.controller('SiteController', function($scope, $uibModal, $state, $q, Server, ErrorHandler){
    function main(){
        initScope();
        fetchSite();
    }

    function initScope(){
        $scope.siteLoading = false;
        $scope.site = null;
        
        $scope.addPage = addPage;
        $scope.editPage = editPage;
        $scope.removePage = removePage;
        $scope.addArticle = addArticle;
        $scope.addFooter = addFooter;
    }

    function addPage(){
        return openAddPageModal('')
            .then(function(pageId){
                return gotoEditPage(pageId);
            });
    }

    function openAddPageModal(pageTitle){
        return $uibModal.open({
            templateUrl: 'addPage.html',
            controller: 'AddPageController',
            resolve: {
                modalParams: {
                    pageTitle,
                },
            },
        }).result;
    }

    function editPage(page){
        return gotoEditPage(page.id);
    }

    function gotoEditPage(pageId){
        return $q.when()
            .then(function(){
                return $state.go('editPage', {
                    pageId,
                });
            });
    }

    function removePage(){
        // TODO
    }

    function addArticle(){
        alert('add article');
        // TODO
    }

    function addFooter(){
        alert('add footer');
        // TODO
    }

    function fetchSite(){
        $scope.siteLoading = true;
        return Server.getSite()
            .then(function(site){
                $scope.site = site;
            })
            .catch(ErrorHandler.handleError)
            .finally(function(){
                $scope.siteLoading = false;
            });
    }

    main();
});
