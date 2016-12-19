app.factory('Server', function($timeout){

    function getSite(){
        // TODO implement me
        return $timeout(function(){
            return {
                title: 'Demo Seite',
                pages: [
                    {
                        id: 's1.json',
                        title: 'Seite 1',
                    },
                ],
                articles: [
                    {
                        id: 'a1.json',
                        title: 'Artikel 1',
                    },
                ],
                footer: [
                    {
                        id: 'f1.json',
                        title: 'Footer 1',
                    },
                ],
            };
        }, 500);
    }

    function addPage(pageTitle){
        // TODO implement me
        return $timeout(function(){
            return `${pageTitle}.json`;
        }, 500);
    }
    
    return {
        getSite,
        addPage,
    };
});
