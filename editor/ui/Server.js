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
        // TODO implement me
        return $timeout(function(){
            return `${pageTitle}.json`;
        }, 700);
    }

    function updatePage(pageId, page){
        // TODO implement me
        return $timeout(function(){
        }, 700);
    }

    function removePage(pageId){
        // TODO implement me
        return $timeout(function(){
        }, 700);
    }
    
    return {
        getSite,
        publishSite,

        getPage,
        addPage,
        updatePage,
        removePage,
    };
});
