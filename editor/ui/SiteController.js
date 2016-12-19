app.controller('SiteController', function($scope, $uibModal, $state, $q, Server, ErrorHandler){
    function main(){
        initScope();
        fetchSite();
    }

    function initScope(){
        $scope.siteLoading = false;
        $scope.publishingSite = false;
        $scope.site = null;
        
        $scope.publishSite = publishSite;
        $scope.addPage = addPage;
        $scope.editPage = editPage;
        $scope.removePage = removePage;
        $scope.addArticle = addArticle;
        $scope.addFooter = addFooter;
    }

    function publishSite(){
        $scope.publishingSite = true;
        return $q.when()
            .then(function(){
                return Server.publishSite();
            })
            .catch(ErrorHandler.handleError)
            .finally(function(){
                $scope.publishingSite = false;
            });
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

    function removePage(pages, pageIndex){
        const page = pages[pageIndex];
        return $q.when()
            .then(function(){
                return $uibModal.open({
                    templateUrl: 'removePageConfirmation.html',
                    controller: 'RemovePageConfirmationController',
                    resolve: {
                        modalParams: {
                            page,
                        },
                    },
                }).result;
            })
            .then(function(){
                return Server.removePage(page.id);
            })
            .then(function(){
                pages.splice(pageIndex, 1);
            })
            .catch(ErrorHandler.handleError);
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
