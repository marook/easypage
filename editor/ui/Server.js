app.factory('Server', function($q){

    function addPage(pageTitle){
        // TODO implement me
        return $q.when(`${pageTitle}.json`);
    }
    
    return {
        addPage,
    };
});
