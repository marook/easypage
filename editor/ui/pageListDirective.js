app.directive('pageList', function(){
    return {
        restrict: 'E',
        templateUrl: 'pageList.html',
        scope: {
            pages: '<',

            /**
             * This expression is evaluated when a new page shoud be
             * created.
             */
            addPage: '&',

            /**
             * This expression is evaluated when an existing page should
             * be edited. Possible special variables in  the expression
             * are:
             * - pageIndex: The index of the page within the pages
             *   array.
             * - page: The page which should be edited.
             */
            editPage: '&',

            /**
             * This expression is evaluated when an existing page should
             * be removed. Possible special variables in  the expression
             * are:
             * - pageIndex: The index of the page within the pages
             *   array.
             * - page: The page which should be removed.
             */
            removePage: '&',

            disabled: '<',
        },
    };
});
