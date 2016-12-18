app.controller('SiteController', function($scope, $uibModal, $state, $q){
    function main(){
        initScope();
    }

    function initScope(){
        $scope.site = {
            title: 'Demo Seite',
            pages: [
                {
                    id: 's1.json',
                    title: 'Seite 1',
                },
            ],
            articles: [
                {
                    id: 'a1.json',
                    title: 'Artikel 1',
                },
            ],
            footer: [
                {
                    id: 'f1.json',
                    title: 'Footer 1',
                },
            ],
        };
        
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

    main();
});
