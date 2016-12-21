app.factory('Server', function($timeout, $http){

    function getSite(){
        return $http({
            method: 'GET',
            url: '/api/site'
        })
            .then(function(response){
                return response.data;
            });
    }

    function publishSite(){
        // TODO implement me
        return $timeout(function(){
        }, 700);
    }

    function getPage(pageId){
        return $http({
            method: 'GET',
            url: `/api/page/${pageId}`,
        })
            .then(function(response){
                return response.data;
            });
    }

    function addPage(pageTitle){
        return addPageToSite('pages', pageTitle);
    }

    function addArticle(pageTitle){
        return addPageToSite('articles', pageTitle);
    }

    function addFooter(pageTitle){
        return addPageToSite('footer', pageTitle);
    }

    function addPageToSite(pageCategory, pageTitle){
        return $http({
            method: 'POST',
            url: `/api/site/${pageCategory}`,
            data: {
                title: pageTitle,
            },
        })
            .then(function(response){
                return response.data;
            });
    }

    function updatePage(pageId, page){
        // TODO implement me
        return $timeout(function(){
        }, 700);
    }

    function removePage(pageId){
        return $http({
            method: 'DELETE',
            url: `/api/page/${pageId}`,
        })
            .then(function(response){
                return response.data;
            });
    }
    
    return {
        getSite,
        publishSite,

        getPage,
        addPage,
        addArticle,
        addFooter,
        updatePage,
        removePage,
    };
});
