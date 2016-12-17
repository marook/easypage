app.directive('pageList', function(){
    return {
        restrict: 'E',
        templateUrl: 'pageList.html',
        scope: {
            pages: '<',
            addPage: '&',
        },
    };
});
