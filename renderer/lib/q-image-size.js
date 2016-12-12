const imageSizeLib = require('image-size');
const q = require('q');

module.exports = function(imagePath){
    return q.when()
        .then(function(){
            const deferred = q.defer();
            imageSizeLib(imagePath, function(e, dimensions){
                if(e){
                    deferred.reject(e);
                } else {
                    deferred.resolve(dimensions);
                }
            });
            return deferred.promise;
        });
};
