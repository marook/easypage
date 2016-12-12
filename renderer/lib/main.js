// -*- coding: utf-8 -*-
const escapeHtml = require('escape-html');
const fs = require('q-io/fs');
const images = require('./images');
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
                 .concat(siteDefinition.footer.map(f => renderer.loadAndRenderPage(siteDefinition, f)))
                );
};

Renderer.prototype.loadAndRenderPage = function loadAndRenderPage(siteDefinition, pageDefinitionPath){
    const renderer = this;
    let fullPageDefinitionPath;
    return q.when()
        .then(function(){
            fullPageDefinitionPath = path.join(siteDefinition.basePath, pageDefinitionPath);
            return loadDefinition(fullPageDefinitionPath);
        })
        .then(function(pageDefinition){
            if(!pageDefinition.basePath){
                pageDefinition.basePath = path.dirname(fullPageDefinitionPath);
            }
            return renderer.renderPage(siteDefinition, pageDefinition, siteDefinition.pages[0] === pageDefinitionPath);
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

Renderer.prototype.renderPage = function renderPage(siteDefiniton, pageDefinition, firstPage){
    const renderer = this;
    let pageDirectoryPath;
    return q.when()
        .then(function(){
            return renderer._buildPageDirectory(siteDefiniton, pageDefinition, firstPage);
        })
        .then(function(_pageDirectoryPath_){
            pageDirectoryPath = _pageDirectoryPath_;
            let promises = [
                q.when('<!DOCTYPE html>\n<html>'),
                renderer.renderPageHead(pageDirectoryPath, siteDefiniton, pageDefinition),
                q.when('<body><div class="ep-container">'),
                renderer.renderPageNavigation(pageDirectoryPath, siteDefiniton, pageDefinition),
                q.when('<div class="ep-content">'),
            ];
            promises = promises.concat(pageDefinition.content.map(c => renderer.renderPageContentSegment(pageDirectoryPath, siteDefiniton, pageDefinition, c)));
            promises = promises.concat([
                q.when('</div>'),
                renderer.renderFooter(pageDirectoryPath, siteDefiniton, pageDefinition),
                q.when('</div></body></html>'),
            ]);
            return q.all(promises);
        })
        .then(function(pageContentHtmlFragments){
            const html = pageContentHtmlFragments.join('');
            return fs.write(path.join(pageDirectoryPath, 'index.html'), html, {
                charset: 'utf-8',
            });
        });
};

Renderer.prototype._buildPageDirectory = function(siteDefiniton, pageDefinition, firstPage){
    const renderer = this;
    let pageDirectoryPath;
    return q.when()
        .then(function(){
            return renderer._getPageDirectoryName(siteDefiniton, pageDefinition, firstPage);
        })
        .then(function(pageDirectoryName){
            pageDirectoryPath = path.join(renderer.outputDir, pageDirectoryName);
            return fs.makeTree(pageDirectoryPath);
        })
        .then(function(){
            return pageDirectoryPath;
        });
};

Renderer.prototype._getPageDirectoryName = function(siteDefiniton, pageDefinition, firstPage){
    const renderer = this;
    if(firstPage){
        /*
         * the first page is by definition the homepage which will be
         * rendered into the root directory.
         */
        return '';
    }
    let pageDirectoryPath;
    return q.when()
        .then(function(){
            const title = pageDefinition.title.trim();
            if(title.length === 0){
                return q.reject(new Error('ep.pageTitleRequired'));
            }
            return urlifyLabel(title);
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
    ['&', '_'],
    ['<', ''],
    ['>', ''],
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
    return urlifiedLabelChars.join('');
}

Renderer.prototype.renderPageHead = function renderPageHead(outputDirPath, siteDefiniton, pageDefinition){
    return q.when()
        .then(function(){
            let htmlArtifacts = [
                `<head><meta charset="UTF-8"/><title>${pageDefinition.title} - ${siteDefiniton.title}</title>`,
            ];
            htmlArtifacts = htmlArtifacts.concat(siteDefiniton.stylesheets.map(s => `<link rel="stylesheet" type="text/css" href="${s}"/>`));
            htmlArtifacts.push('</head>');
            return htmlArtifacts.join('');
        });
};

Renderer.prototype.renderPageNavigation = function renderPageNavigation(outputDirPath, siteDefiniton, pageDefinition){
    const renderer = this;
    return q.when()
        .then(function(){
            return q.all([
                q.when('<nav class="ep-page-navigation"><ul>'),
                renderer.renderPageNavigationLinks(outputDirPath, siteDefiniton, pageDefinition),
                q.when('</ul></nav>'),
            ]);
        })
        .then(function(htmlArtifacts){
            return htmlArtifacts.join('');
        });
};

Renderer.prototype.renderPageNavigationLinks = function renderPageNavigationLinks(outputDirPath, siteDefinition, activePageDefinition){
    const renderer = this;
    let pageDefinitions;
    return q.when()
        .then(function(){
            return q.all(siteDefinition.pages.map(pageDefinitionPath => loadDefinition(path.join(siteDefinition.basePath, pageDefinitionPath))));
        })
        .then(function(_pageDefinitions_){
            pageDefinitions = _pageDefinitions_;
            return q.all(pageDefinitions.map((pd, i) => renderer._getPageDirectoryName(siteDefinition, pd, i === 0)));
        })
        .then(function(pageDirectoryNames){
            return pageDefinitions.map((pd, i) => `<li><a href="/${pageDirectoryNames[i]}">${escapeHtml(pd.title)}</a></li>`)
                .join('');
        });
};

Renderer.prototype.renderPageContentSegment = function renderPageContentSegment(outputDirPath, siteDefiniton, pageDefinition, content){
    const renderer = this;
    return q.when()
        .then(function(){
            switch(content.type){
            default:
                return q.reject(new Error('ep.unknownContentSegmentType: ' + content.type));
            case 'articles-archive':
                return renderer._renderPageContentSegmentArticlesArchive(outputDirPath, siteDefiniton, pageDefinition, content);
            case 'headline':
                return renderer._renderPageContentSegmentHeadline(outputDirPath, siteDefiniton, pageDefinition, content);
            case 'image':
                return renderer._renderPageContentSegmentImage(outputDirPath, siteDefiniton, pageDefinition, content);
            case 'lines':
                return renderer._renderPageContentSegmentLines(outputDirPath, siteDefiniton, pageDefinition, content);
            case 'paragraph':
                return renderer._renderPageContentSegmentParagraph(outputDirPath, siteDefiniton, pageDefinition, content);
            }
        });
};

Renderer.prototype._renderPageContentSegmentArticlesArchive = function _renderPageContentSegmentArticlesArchive(outputDirPath, siteDefinition, pageDefinition, content){
    const renderer = this;
    let articleDefinitions;
    return q.when()
        .then(function(){
            return q.all(siteDefinition.articles.map(articleDefinitionPath => loadDefinition(path.join(siteDefinition.basePath, articleDefinitionPath))));
        })
        .then(function(_articleDefinitions_){
            articleDefinitions = _articleDefinitions_;
            return q.all(articleDefinitions.map((ad, i) => renderer._getPageDirectoryName(siteDefinition, ad, false)));
        })
        .then(function(articleDirectoryNames){
            let htmlFragments = [
                '<ul class="ep-article-archive">',
            ];
            htmlFragments = htmlFragments.concat(articleDefinitions.map((ad, i) => `<li><a class="ep-article-archive-link" href="/${articleDirectoryNames[i]}">${ad.title}</a></li>`));
            htmlFragments.push('</ul>');
            return htmlFragments.join('');
        });
};

Renderer.prototype._renderPageContentSegmentHeadline = function _renderPageContentSegmentHeadline(outputDirPath, siteDefiniton, pageDefinition, content){
    return `<h1 class="ep-headline">${escapeHtml(content.text)}</h1>`;
};

Renderer.prototype._renderPageContentSegmentImage = function _renderPageContentSegmentImage(outputDirPath, siteDefiniton, pageDefinition, content){
    let renderedImagePath;
    return q.when()
        .then(function(){
            renderedImagePath = path.join(outputDirPath, content.src);
            return images.webifyImage(renderedImagePath, path.join(pageDefinition.basePath, content.src));
        })
        .then(function(imageResolution){
            return `<div class="ep-image"><img src="${path.basename(renderedImagePath)}"/></div>`;
        });
};

Renderer.prototype._renderPageContentSegmentLines = function _renderPageContentSegmentLines(outputDirPath, siteDefiniton, pageDefinition, content){
    let htmlArtifacts = [
        '<p class="ep-lines">',
    ];
    htmlArtifacts = htmlArtifacts.concat(content.lines.map(line => `<span>${escapeHtml(line)}</span><br/>`));
    htmlArtifacts.push('</p>');
    return htmlArtifacts.join('');
};

Renderer.prototype._renderPageContentSegmentParagraph = function _renderPageContentSegmentParagraph(outputDirPath, siteDefiniton, pageDefinition, content){
    return `<p class="ep-paragraph">${escapeHtml(content.text)}</p>`;
};

Renderer.prototype.renderFooter = function renderFooter(outputDirPath, siteDefiniton, pageDefinition){
};

if(require.main === module){
    renderSite(process.argv[2], process.argv[3])
        .catch(function(e){
            console.log('Rendering failed: ', e, e.stack);
            process.exit(1);
        });
}

module.exports = {
    renderSite,
    Renderer,
};
