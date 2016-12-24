app.controller('PageListController', function($scope){
    function main(){
        initScope();
    }

    function initScope(){
        $scope.movePageUpwards = movePageUpwards;
        $scope.movePageDownwards = movePageDownwards;
    }

    function movePageUpwards(pageIndex){
        switchPages(pageIndex - 1, pageIndex);
    }

    function movePageDownwards(pageIndex){
        switchPages(pageIndex, pageIndex + 1);
    }

    function switchPages(i1, i2){
        const p1 = $scope.pages[i1];
        $scope.pages[i1] = $scope.pages[i2];
        $scope.pages[i2] = p1;
    }

    main();
});
