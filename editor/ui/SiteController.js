app.controller('SiteController', function($scope){
    function main(){
        initScope();
    }

    function initScope(){
        $scope.site = {
            pages: [
                {
                    title: 'Seite 1',
                },
            ],
            articles: [
                {
                    title: 'Artikel 1',
                },
            ],
            footer: [
                {
                    title: 'Footer 1',
                },
            ],
        };
        
        $scope.addPage = addPage;
        $scope.addArticle = addArticle;
        $scope.addFooter = addFooter;
    }

    function addPage(){
        alert('add page');
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
