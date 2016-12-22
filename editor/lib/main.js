const argv = require('yargs').argv;
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');
const express = require('express');
const expressSession = require('express-session');
const fs = require('q-io/fs');
const passport = require('passport');
const passportLocal = require('passport-local');
const path = require('path');
const q = require('q');
const sites = require('./sites');

const site = new sites.Site(argv.site);

function main(){
    return q.when()
        .then(function(){
            passport.use(new passportLocal.Strategy(function(username, password, done){
                q.when()
                    .then(function(){
                        return fs.read(argv.users);
                    })
                    .then(function(usersBuffer){
                        const passwordHash = crypto.createHmac('sha512', username)
                              .update(password)
                              .digest('hex');
                        for(let user of JSON.parse(usersBuffer)){
                            if(user.username === username && user.password === passwordHash){
                                done(null, user.username);
                                return;
                            }
                        }
                        done(null, false);
                    })
                    .catch(function(e){
                        console.log('>>>', e);
                        done(e);
                    });
            }));

            passport.serializeUser(function(user, done) {
                done(null, user);
            });

            passport.deserializeUser(function(user, done) {
                done(null, user);
            });
        })
        .then(function(){
            return createExpressApp();
        })
        .then(function(app){
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
                            if(!req.user){
                                return q.reject({
                                    httpStatusCode: 401,
                                });
                            }
                            return handler(req, res);
                        })
                        .then(function(responseData){
                            res.json(responseData);
                        })
                        .catch(function(e){
                            const httpStatusCode = (e && e.httpStatusCode) || 500;
                            if(httpStatusCode === 401){
                                res.status(401).send('Not authenticated');
                            } else if(httpStatusCode === 500){
                                console.error('Server error', e, e.stack);
                                res.status(500).send('Server error');
                            } else {
                                res.status(httpStatusCode).send(e.responseData || '');
                            }
                        });
                });
            }

            app.post('/login', passport.authenticate('local'), function(req, res){
                res.send();
            });

            app.listen(argv.port || 8080);
            console.log('Server is ready');
        });
}

function createExpressApp(){
    let app;
    return q.when()
        .then(function(){
            app = express();
            app.use(cookieParser());
            app.use(bodyParser.json());
        })
        .then(function(){
            const sessionSecretFilePath = `${argv.site}.sessionSecret`;
            return fs.read(sessionSecretFilePath)
                .catch(function(e){
                    const deferred = q.defer();
                    crypto.randomBytes(512, function(e, buffer){
                        const sessionSecret = buffer.toString('hex');
                        q.resolve(sessionSecret);
                        fs.write(sessionSecretFilePath, sessionSecret, {
                            mode: 400,
                        });
                    });
                    return deferred.promise;
                })
                .then(function(sessionSecret){
                    app.use(expressSession({
                        secret: sessionSecret,
                        resave: true,
                        saveUninitialized: true,
                    }));
                });
        })
        .then(function(){
            app.use(passport.initialize());
            app.use(passport.session());
            return app;
        });
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
