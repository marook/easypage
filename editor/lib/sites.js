const child_process = require('./child_process_q');
const fs = require('q-io/fs');
const images = require('./images');
const path = require('path');
const q = require('q');

function Site(sitePath){
    this.sitePath = sitePath;
    this.pageMetadataCache = new Map();
    this.nextPageNumber = 0;
    this.siteDescription = this.loadSiteDescription();
}

Site.prototype.loadSiteDescription = function(){
    const site = this;
    return q.when()
        .then(function(){
            site.pageMetadataCache.clear();
            return fs.read(site.sitePath);
        })
        .then(function(siteDescriptionBuffer){
            const siteDescription = JSON.parse(siteDescriptionBuffer);
            if(!siteDescription.hasOwnProperty('basePath')){
                siteDescription.basePath = path.dirname(site.sitePath);
            }
            return siteDescription;
        });
};

Site.prototype.saveSiteDescription = function(siteDescription){
    const site = this;
    let formerSiteDescription;
    return q.when()
        .then(function(){
            return site.siteDescription;
        })
        .then(function(_formerSiteDescription_){
            formerSiteDescription = _formerSiteDescription_;
            for(let property of ['title', 'pages', 'articles', 'footer']){
                if(!siteDescription.hasOwnProperty(property)){
                    continue;
                }
                formerSiteDescription[property] = siteDescription[property];
            }
            formerSiteDescription.lastModified = '' + new Date();
            return fs.write(site.sitePath, JSON.stringify(formerSiteDescription));
        })
        .then(function(){
            site.siteDescription = q.when(formerSiteDescription);
        });
};

Site.prototype.getSiteJson = function(){
    const site = this;
    let siteJson;
    return q.when()
        .then(function(){
            return site.siteDescription;
        })
        .then(function(siteDescription){
            const promises = [];
            siteJson = {
                title: siteDescription.title,
                pages: siteDescription.pages.map(buildPageJson),
                articles: siteDescription.articles.map(buildPageJson),
                footer: siteDescription.footer.map(buildPageJson),
            };
            return q.all(promises);

            function buildPageJson(pagePath){
                const pageJson = {
                    id: pagePath,
                };
                promises.push(site.getPageMetadata(pagePath)
                              .then(function(pageMetadata){
                                  pageJson.title = pageMetadata.title;
                                  pageJson.firstPublished = pageMetadata.firstPublished || null;
                              }));
                return pageJson;
            }
        })
        .then(function(){
            return siteJson;
        });
};

Site.prototype.updateSite = function(newSiteDescription){
    const site = this;
    return q.when()
        .then(function(){
            return site.siteDescription;
        })
        .then(function(siteDescription){
            const knownPages = new Set(siteDescription.pages.concat(siteDescription.articles, siteDescription.footer));
            for(let page of newSiteDescription.pages.concat(newSiteDescription.articles, newSiteDescription.footer)){
                if(!knownPages.has(page)){
                    return q.reject('UNKNOWN_PAGE');
                }
            }
        })
        .then(function(){
            return site.saveSiteDescription({
                pages: newSiteDescription.pages,
                articles: newSiteDescription.articles,
                footer: newSiteDescription.footer,
            });
        });
};

Site.prototype.ensureIsPage = function(pagePath){
    const site = this;
    return q.when()
        .then(function(){
            return site.siteDescription;
        })
        .then(function(siteDescription){
            for(let pages of [siteDescription.pages, siteDescription.articles, siteDescription.footer]){
                for(let page of pages){
                    if(page === pagePath){
                        return;
                    }
                }
            }
            return q.reject(new Error(`Unknown page: ${pagePath}`));
        });
};

Site.prototype.getPage = function(pagePath){
    const site = this;
    return q.when()
        .then(function(){
            return site.loadPageDescription(pagePath);
        })
        .then(function(pageDescription){
            const pageJson = {};
            for(let key of ['title', 'content', 'firstPublished']){
                pageJson[key] = pageDescription[key];
            }
            return pageJson;
        });
};

Site.prototype.getPageMetadata = function(pagePath){
    const site = this;
    if(site.pageMetadataCache.has(pagePath)){
        return site.pageMetadataCache.get(pagePath);
    }
    const promise = q.when()
          .then(function(){
              return site.loadPageDescription(pagePath);
          })
          .then(function(pageDescription){
              return {
                  title: pageDescription.title,
                  firstPublished: pageDescription.firstPublished,
              };
          });
    site.pageMetadataCache.set(pagePath, promise);
    return promise;
};

Site.prototype.loadPageDescription = function(pagePath){
    const site = this;
    let pageFullPath;
    return q.when()
        .then(function(){
            return site.ensureIsPage(pagePath);
        })
        .then(function(){
            return site.getPageFullPath(pagePath);
        })
        .then(function(_pageFullPath_){
            pageFullPath = _pageFullPath_;
            return fs.read(pageFullPath);
        })
        .then(function(pageDescriptionBuffer){
            const pageDescription = JSON.parse(pageDescriptionBuffer);
            if(!pageDescription.hasOwnProperty('basePath')){
                pageDescription.basePath = path.dirname(pageFullPath);
            }
            return pageDescription;
        });
}

const PAGE_DESCRIPTION_DEFAULT_PROPERTIES = {
    title: '',
    content: [],
};

Site.prototype.savePageDescription = function(pagePath, pageDescription, _formerPageDescription_){
    const site = this;
    return q.when()
        .then(function(){
            return q.all([
                site.getPageFullPath(pagePath),
                _formerPageDescription_ ? q.when(_formerPageDescription_) : site.loadPageDescription(pagePath),
            ]);
        })
        .then(function(args){
            const [pageFullPath, formerPageDescription] = args;
            for(let key in pageDescription){
                if(!pageDescription.hasOwnProperty(key)){
                    continue;
                }
                formerPageDescription[key] = pageDescription[key];
            }
            for(let key in PAGE_DESCRIPTION_DEFAULT_PROPERTIES){
                if(!PAGE_DESCRIPTION_DEFAULT_PROPERTIES.hasOwnProperty(key)){
                    continue;
                }
                if(formerPageDescription.hasOwnProperty(key)){
                    continue
                }
                formerPageDescription[key] = PAGE_DESCRIPTION_DEFAULT_PROPERTIES[key];
            }
            formerPageDescription.lastModified = '' + new Date();
            return fs.write(pageFullPath, JSON.stringify(formerPageDescription));
        });
};

Site.prototype.deletePage = function(pagePath){
    const site = this;
    return q.when()
        .then(function(){
            return site.ensureIsPage(pagePath);
        })
        .then(function(){
            return site.getPageFullPath(pagePath);
        })
        .then(function(pageFullPath){
            return fs.remove(pageFullPath);
        })
        .then(function(){
            return site.siteDescription;
        })
        .then(function(siteDescription){
            site.pageMetadataCache.delete(pagePath);
            siteDescription.pages = siteDescription.pages.filter(p => p !== pagePath);
            siteDescription.articles = siteDescription.articles.filter(p => p !== pagePath);
            siteDescription.footer = siteDescription.footer.filter(p => p !== pagePath);
            return site.saveSiteDescription(siteDescription);
        });
};

const PAGE_CATEGORIES = new Set([
    'pages',
    'articles',
    'footer',
]);

Site.prototype.addPage = function(pageCategory, pageDescription){
    const site = this;
    let pagePath;
    return q.when()
        .then(function(){
            if(!PAGE_CATEGORIES.has(pageCategory)){
                return q.reject(new Error(`Unknown pageCategory: ${pageCategory}`));
            }
            return site.nextPagePath();
        })
        .then(function(_pagePath_){
            pagePath = _pagePath_;
            return q.all([
                site.addPagePathToSite(pageCategory, pagePath),
                site.savePageDescription(pagePath, pageDescription, {}),
            ]);
        })
        .then(function(){
            return pagePath;
        });
};

Site.prototype.updatePage = function(pagePath, pageDescription){
    const site = this;
    return q.when()
        .then(function(){
            return site.ensureIsPage(pagePath);
        })
        .then(function(){
            return site.savePageDescription(pagePath, pageDescription);
        });
};

Site.prototype.addPagePathToSite = function(pageCategory, pagePath){
    const site = this;
    return q.when()
        .then(function(){
            return site.siteDescription;
        })
        .then(function(siteDescription){
            siteDescription[pageCategory].push(pagePath);
            return site.saveSiteDescription(siteDescription);
        });
};

Site.prototype.nextPagePath = function(){
    const site = this;
    return q.when()
        .then(function(){
            return site.siteDescription;
        })
        .then(function(siteDescription){
            const existingPagePaths = new Set(siteDescription.pages.concat(siteDescription.articles, siteDescription.footer));
            while(true){
                const nextPagePath = `page-${site.nextPageNumber}.json`;
                if(!existingPagePaths.has(nextPagePath)){
                    return nextPagePath;
                }
                site.nextPageNumber += 1;
            }
        });
};

Site.prototype.getPageFullPath = function(pagePath){
    const site = this;
    return q.when()
        .then(function(){
            return site.siteDescription;
        })
        .then(function(siteDescription){
            return path.join(siteDescription.basePath, pagePath);
        });
};

Site.prototype.getPreviewImagePath = function(imageFileName){
    const site = this;
    let siteDescription, previewImagePath;
    return q.when()
        .then(function(){
            return site.siteDescription;
        })
        .then(function(_siteDescription_){
            siteDescription = _siteDescription_;
            previewImagePath = path.join(siteDescription.basePath, `${imageFileName}-preview`);
            return fs.exists(previewImagePath);
        })
        .then(function(previewImageExists){
            if(!previewImageExists){
                const inputImagePath = path.join(siteDescription.basePath, imageFileName);
                return images.resizeImage(previewImagePath, inputImagePath, 400, 300);
            }
        })
        .then(function(){
            return path.resolve(previewImagePath);
        });
};

Site.prototype.publish = function(){
    const site = this;
    const publishDate = new Date();
    let siteDescription;
    return q.when()
        .then(function(){
            return site.siteDescription;
        })
        .then(function(_siteDescription_){
            siteDescription = _siteDescription_;
            return q.all(siteDescription.pages.concat(siteDescription.articles, siteDescription.footer).map(pagePath => site.setPagePublishDate(pagePath, publishDate)));
        })
        .then(function(){
            site.siteDescription = site.loadSiteDescription();
            return child_process.exec(siteDescription.publish, {
                cwd: siteDescription.basePath,
            });
        })
        .then(function(stdout){
            // we don't want to pass stdout to the caller
            return undefined;
        });
};

Site.prototype.setPagePublishDate = function(pagePath, publishDate){
    const site = this;
    return q.when()
        .then(function(){
            return site.loadPageDescription(pagePath);
        })
        .then(function(pageDescription){
            if(!pageDescription.firstPublished){
                pageDescription.firstPublished = publishDate;
                return site.savePageDescription(pagePath, pageDescription, pageDescription);
            }
        });
};

module.exports = {
    Site,
};
