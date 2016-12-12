const im = require('imagemagick');
const q = require('q');

function convert(){
    const args = Array.prototype.slice.call(arguments);
    return q.when()
        .then(function(){
            const deferred = q.defer();
            im.convert(args, function(e){
                if(e){
                    deferred.reject(e);
                } else {
                    deferred.resolve();
                }
            });
            return deferred.promise;
        });
}

module.exports = {
    convert,
};
