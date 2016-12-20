const fs = require('q-io/fs');
const path = require('path');
const q = require('q');

function Site(sitePath){
    this.sitePath = sitePath;
    this.pageMetadataCache = new Map();
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
            return JSON.stringify(siteJson);
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
            return site.siteDescription;
        })
        .then(function(siteDescription){
            pageFullPath = path.join(siteDescription.basePath, pagePath);
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

module.exports = {
    Site,
};
