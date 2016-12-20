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
        // TODO implement me
        return $timeout(function(){
            return {
                title: 'Meine Seite',
                content: [
                    {
                        "type": "headline",
                        "text": "Overview"
                    },
                    {
                        "type": "paragraph",
                        "text": "Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet."
                    },
                    {
                        "type": "image",
                        "src": "view.jpg",
                        "title": "You see some grass."
                    },
                    {
                        type: 'articles-archive',
                    },
                    {
                        type: 'list',
                        style: 'none',
                        lines: [
                            'line 0',
                            'line 1',
                            'line 2',
                        ],
                    },
                ]
            };
        }, 700);
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