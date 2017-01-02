app.controller('SiteController', function($scope, $uibModal, $state, $q, Server, ErrorHandler){
    function main(){
        initScope();
        fetchSite();
    }

    function initScope(){
        $scope.siteLoading = false;
        $scope.publishingSite = false;
        $scope.updatingSite = false;
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
            .then(function(){
                return fetchSite();
            })
            .catch(ErrorHandler.handleError)
            .finally(function(){
                $scope.publishingSite = false;
            });
    }

    function addPage(){
        return editNewPage('page');
    }

    function editNewPage(pageCategory){
        return openAddPageModal(pageCategory, '')
            .then(function(pageId){
                return gotoEditPage(pageId);
            });
    }

    function openAddPageModal(pageCategory, pageTitle){
        return $uibModal.open({
            templateUrl: 'addPage.html',
            controller: 'AddPageController',
            resolve: {
                modalParams: {
                    pageCategory,
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
        return editNewPage('article');
    }

    function addFooter(){
        return editNewPage('footer');
    }

    function fetchSite(){
        $scope.siteLoading = true;
        return Server.getSite()
            .then(function(site){
                $scope.site = site;
                watchPagesForOrderChanges();
            })
            .catch(ErrorHandler.handleError)
            .finally(function(){
                $scope.siteLoading = false;
            });
    }

    function watchPagesForOrderChanges(){
        let firstCall = true;
        $scope.$watchCollection('site.pages', function(){
            if(firstCall){
                firstCall = false;
                return;
            }
            savePageOrder();
        });
    }

    function savePageOrder(){
        $scope.updatingSite = true;
        return $q.when()
            .then(function(){
                const site = {
                    pages: $scope.site.pages.map(p => p.id),
                    articles: $scope.site.articles.map(a => a.id),
                    footer: $scope.site.footer.map(f => f.id),
                };
                return Server.updateSite(site);
            })
            .catch(ErrorHandler.handleError)
            .finally(function(){
                $scope.updatingSite = false;
            });
    }

    main();
});
