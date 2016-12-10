const q = require('q');

function Renderer(outputDir){
    this.outputDir = outputDir;
}

Renderer.prototype.renderSite = function renderSite(siteDefinition){
    const renderer = this;
    return q.all([]
                 .concat(siteDefinition.pages.map(p => renderer.renderPage(p)))
                 .concat(siteDefinition.articles.map(a => renderer.renderPage(a)))
                );
};

Renderer.prototype.renderPage = function renderPage(siteDefiniton, pageDefinition){
    return q.when()
        .then(function(){
            // TODO
        });
    // TODO
};
