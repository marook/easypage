const argv = require('yargs').argv;
const bodyParser = require('body-parser');
const express = require('express');
const path = require('path');
const q = require('q');
const sites = require('./sites');

const site = new sites.Site(argv.site);

function main(){
    const app = express();
    app.use(bodyParser.json());

    const handlers = [
        ['get', '/site', handleGetSite],
        ['get', '/page/:pageId', handleGetPage],
        ['put', '/page/:pageId', handlePutPage],
        ['delete', '/page/:pageId', handleDeletePage],
        ['post', '/site/:pageCategory', handleAddPage],
    ];
    for(let [method, path, handler] of handlers){
        app[method](path, function(req, res){
            return q.when()
                .then(function(){
                    return handler(req, res);
                })
                .then(function(responseData){
                    res.json(responseData);
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
    return site.getSiteJson();
}

function handleGetPage(req, res){
    return site.getPage(req.params.pageId);
}

function handlePutPage(req, res){
    return site.updatePage(req.params.pageId, req.body);
}

function handleDeletePage(req, res){
    return site.deletePage(req.params.pageId);
}

function handleAddPage(req, res){
    return site.addPage(req.params.pageCategory, req.body);
}

main();
