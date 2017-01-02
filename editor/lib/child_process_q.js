const child_process = require('child_process');
const q = require('q');

function exec(command, options){
    return q.when()
        .then(function(){
            const deferred = q.defer();
            child_process.exec(command, options, function(error, stdout, stderr){
                if(error){
                    deferred.reject(error);
                } else {
                    deferred.resolve(stdout);
                }
            });
            return deferred.promise;
        });
}

module.exports = {
    exec,
};
