const fs = require('q-io/fs');
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
    return q.when()
        .then(function(){
            const persistedSiteDescription = {};
            for(let property of ['title', 'pages', 'articles', 'footer']){
                persistedSiteDescription[property] = siteDescription[property];
            }
            persistedSiteDescription.lastModified = '' + new Date();
            return fs.write(site.sitePath, JSON.stringify(persistedSiteDescription));
        })
        .then(function(){
            site.siteDescription = q.when(siteDescription);
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
                              }));
                return pageJson;
            }
        })
        .then(function(){
            return siteJson;
        });
};

Site.prototype.getPage = function(pagePath){
    return this.loadPageDescription(pagePath);
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

Site.prototype.savePageDescription = function(pagePath, pageDescription){
    const site = this;
    return q.when()
        .then(function(){
            return site.getPageFullPath(pagePath);
        })
        .then(function(pageFullPath){
            for(let key in PAGE_DESCRIPTION_DEFAULT_PROPERTIES){
                if(!PAGE_DESCRIPTION_DEFAULT_PROPERTIES.hasOwnProperty(key)){
                    continue;
                }
                if(pageDescription.hasOwnProperty(key)){
                    continue
                }
                pageDescription[key] = PAGE_DESCRIPTION_DEFAULT_PROPERTIES[key];
            }
            pageDescription.lastModified = '' + new Date();
            return fs.write(pageFullPath, JSON.stringify(pageDescription));
        });
};

Site.prototype.deletePage = function(pagePath){
    const site = this;
    return q.when()
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
                site.savePageDescription(pagePath, pageDescription),
            ]);
        })
        .then(function(){
            return pagePath;
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

module.exports = {
    Site,
};
