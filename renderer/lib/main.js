const escapeHtml = require('escape-html');
const fs = require('q-io/fs');
const path = require('path');
const q = require('q');

function renderSite(outputDirPath, siteDefinitionPath){
    return q.when()
        .then(function(){
            return fs.read(siteDefinitionPath);
        })
        .then(function(siteDefinitionTxt){
            const siteDefinition = JSON.parse(siteDefinitionTxt);
            if(!siteDefinition.basePath){
                siteDefinition.basePath = path.dirname(siteDefinitionPath);
            }
            const renderer = new Renderer(outputDirPath);
            return renderer.renderSite(siteDefinition);
        });
}

function Renderer(outputDir){
    this.outputDir = outputDir;
}

Renderer.prototype.renderSite = function renderSite(siteDefinition){
    const renderer = this;
    return q.all([]
                 .concat(siteDefinition.pages.map(p => renderer.loadAndRenderPage(siteDefinition, p)))
                 .concat(siteDefinition.articles.map(a => renderer.loadAndRenderPage(siteDefinition, a)))
                );
};

Renderer.prototype.loadAndRenderPage = function loadAndRenderPage(siteDefinition, pageDefinitionPath){
    const renderer = this;
    return q.when()
        .then(function(){
            return loadDefinition(path.join(siteDefinition.basePath, pageDefinitionPath));
        })
        .then(function(pageDefinition){
            return renderer.renderPage(siteDefinition, pageDefinition);
        });
};

function loadDefinition(definitionPath){
    return q.when()
        .then(function(){
            return fs.read(definitionPath);
        })
        .then(function(definitionTxt){
            const definition = JSON.parse(definitionTxt);
            if(!definition.basePath){
                definition.basePath = path.dirname(definitionPath);
            }
            return definition;
        });
}

Renderer.prototype.renderPage = function renderPage(siteDefiniton, pageDefinition){
    const renderer = this;
    return q.when()
        .then(function(){
            return renderer._buildPageDirectory(siteDefiniton, pageDefinition);
        })
        .then(function(pageDirectoryPath){
            return q.all(pageDefinition.content.map(c => renderer.renderPageContentSegment(pageDirectoryPath, siteDefiniton, pageDefinition, c)));
        })
        .then(function(pageContentHtmlFragments){
            console.log('>>>', pageContentHtmlFragments.join(''));
        });
};

Renderer.prototype._buildPageDirectory = function(siteDefiniton, pageDefinition){
    const renderer = this;
    let pageDirectoryPath;
    return q.when()
        .then(function(){
            const title = pageDefinition.title.trim();
            if(title.length === 0){
                return q.reject(new Error('ep.pageTitleRequired'));
            }
            pageDirectoryPath = path.join(renderer.outputDir, urlifyLabel(title));
            return fs.makeTree(pageDirectoryPath);
        })
        .then(function(){
            return pageDirectoryPath;
        });
};

const URLIFY_CHARACTER_REPLACEMENT_MAP = new Map([
    [' ', '_'],
    ['ä', 'ae'],
    ['ö', 'oe'],
    ['ü', 'ue'],
    ['.', ''],
    [',', ''],
    [':', ''],
]);

function urlifyLabel(label){
    let urlifiedLabelChars = [];
    for(let c of label.toLowerCase()){
        if(URLIFY_CHARACTER_REPLACEMENT_MAP.has(c)){
            urlifiedLabelChars.push(URLIFY_CHARACTER_REPLACEMENT_MAP.get(c));
        } else {
            urlifiedLabelChars.push(c);
        }
    }
    return urlifiedLabelChars.join();
}

Renderer.prototype.renderPageContentSegment = function renderPageContentSegment(outputDirPath, siteDefiniton, pageDefinition, content){
    const renderer = this;
    return q.when()
        .then(function(){
            switch(content.type){
            default:
                return q.reject(new Error('ep.unknownContentSegmentType: ' + content.type));
            case 'h1':
                return renderer._renderPageContentSegmentHeadline(outputDirPath, siteDefiniton, pageDefinition, content);
            case 'image':
                return renderer._renderPageContentSegmentImage(outputDirPath, siteDefiniton, pageDefinition, content);
            case 'paragraph':
                return renderer._renderPageContentSegmentParagraph(outputDirPath, siteDefiniton, pageDefinition, content);
            }
        });
};

Renderer.prototype._renderPageContentSegmentHeadline = function _renderPageContentSegmentHeadline(outputDirPath, siteDefiniton, pageDefinition, content){
    return `<h1>${escapeHtml(content.text)}</h1>`;
};

Renderer.prototype._renderPageContentSegmentImage = function _renderPageContentSegmentImage(outputDirPath, siteDefiniton, pageDefinition, content){
    return ''; // TODO
};

Renderer.prototype._renderPageContentSegmentParagraph = function _renderPageContentSegmentParagraph(outputDirPath, siteDefiniton, pageDefinition, content){
    return `<p>${escapeHtml(content.text)}</p>`;
};

if(require.main === module){
    renderSite(process.argv[2], process.argv[3])
        .catch(function(e){
            console.log('Rendering failed: ', e, e.stack);
            process.exit(1);
        });
}

module.exports = {
    Renderer,
};
