app.factory('StringUtils', function(){
    function toFirstUpper(s){
        return s.substring(0, 1).toUpperCase() + s.substring(1);
    }

    return {
        toFirstUpper,
    };
});
