app.config(function($stateProvider, $urlRouterProvider){
    $urlRouterProvider.otherwise('/');
    $stateProvider
        .state('site', {
            url: '/',
            templateUrl: 'site.html',
            controller: 'SiteController',
        })
        .state('editPage', {
            url: '/edit/:pageId',
            templateUrl: 'editPage.html',
            controller: 'EditPageController',
        });
});
