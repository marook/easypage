app.config(function($stateProvider, $urlRouterProvider){
    $urlRouterProvider.otherwise('/');
    $stateProvider
        .state('login', {
            url: '/login',
            templateUrl: 'login.html',
            controller: 'LoginController',
        })
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
