app.factory('Server', function($timeout, $http, $q, $state){

    function login(username, password){
        return $http({
            method: 'POST',
            url: 'api/login',
            data: {
                username,
                password,
            },
        })
            .catch(function(response){
                if(response.status === 401){
                    return $q.reject('INVALID_LOGIN_CREDENTIALS');
                } else {
                    return $q.reject(response);
                }
            })
            .then(function(response){
                return response.data;
            });
    }

    function getSite(){
        return $http({
            method: 'GET',
            url: 'api/site'
        })
            .catch(handleServerErrors)
            .then(function(response){
                const siteDescription = response.data;
                for(let page of siteDescription.pages.concat(siteDescription.articles, siteDescription.footer)){
                    if(page.firstPublished){
                        page.firstPublished = new Date(page.firstPublished);
                    }
                }
                return siteDescription;
            });
    }

    function updateSite(siteDescription){
        return $http({
            method: 'PUT',
            url: 'api/site',
            data: siteDescription,
        })
            .catch(handleServerErrors)
                .then(function(resonse){
                    return resonse.data;
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
            url: `api/page/${pageId}`,
        })
            .catch(handleServerErrors)
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
            url: `api/site/${pageCategory}`,
            data: {
                title: pageTitle,
            },
        })
            .catch(handleServerErrors)
            .then(function(response){
                return response.data;
            });
    }

    function updatePage(pageId, page){
        return $http({
            method: 'PUT',
            url: `api/page/${pageId}`,
            data: page,
        })
            .catch(handleServerErrors)
            .then(function(response){
                return response.data;
            });
    }

    function removePage(pageId){
        return $http({
            method: 'DELETE',
            url: `api/page/${pageId}`,
        })
            .catch(handleServerErrors)
            .then(function(response){
                return response.data;
            });
    }

    function handleServerErrors(response){
        if(response.status === 401){
            $state.go('login');
            return $q.reject('NOT_AUTHORIZED');
        } else {
            return $q.reject(response);
        }
    }
    
    return {
        login,
    
        getSite,
        updateSite,
        publishSite,

        getPage,
        addPage,
        addArticle,
        addFooter,
        updatePage,
        removePage,
    };
});
