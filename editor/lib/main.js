const argv = require('yargs').argv;
const express = require('express');
const path = require('path');
const q = require('q');
const sites = require('./sites');

const site = new sites.Site(argv.site);

function main(){
    const app = express();

    const handlers = [
        ['get', '/site', handleGetSite],
    ];
    for(let [method, path, handler] of handlers){
        app[method](path, function(req, res){
            return q.when()
                .then(function(){
                    return handler(req, res);
                })
                .then(function(responseData){
                    res.send(responseData);
                })
                .catch(function(e){
                    const httpStatusCode = (e && e.httpStatusCode) || 500;
                    if(httpStatusCode === 500){
                        console.error('Server error', e, e.stack);
                        res.status(500).send('Server error');
                    } else {
                        res.status(httpStatusCode).send(e.responseData || '');
                    }
                });
        });
    }

    app.listen(argv.port || 8080);
}

function handleGetSite(req, res){
    return q.when()
        .then(function(){
            return site.getSiteJson();
        });
}

main();
