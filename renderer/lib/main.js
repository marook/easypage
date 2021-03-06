// -*- coding: utf-8 -*-
const escapeHtml = require('escape-html');
const fs = require('q-io/fs');
const images = require('./images');
const path = require('path');
const q = require('q');

function renderSite(outputDirPath, siteDefinitionPath){
    return q.when()
        .then(function(){
            return new Renderer(outputDirPath, siteDefinitionPath).renderSite();
        });
}

function Renderer(outputDir, siteDefinitionPath){
    this.outputDir = outputDir;
    this._siteDefinition = this._getSiteDefinition(siteDefinitionPath);
    /**
     * Key is the page JSON's path. Value is a promise which resolves to
     * the page object which is the parsed page JSON. May also contain
     * pages for the articles, footer or any other section which
     * contains pages.
     */
    this._pageDefinitions = new Map();
}

Renderer.prototype._getSiteDefinition = function _getSiteDefinition(siteDefinitionPath){
    return q.when()
        .then(function(){
            return fs.read(siteDefinitionPath);
        })
        .then(function(siteDefinitionTxt){
            const siteDefinition = JSON.parse(siteDefinitionTxt);
            siteDefinition.$basePath = path.dirname(siteDefinitionPath);
            return siteDefinition;
        });
};

Renderer.prototype._getPageDefinition = function _getPageDefinition(pageDefinitionPath){
    const renderer = this;
    if(renderer._pageDefinitions.has(pageDefinitionPath)){
        return renderer._pageDefinitions.get(pageDefinitionPath);
    }
    let siteDefinition;
    const pageLoadPromise = q.when()
          .then(function(){
              return renderer._siteDefinition;
          })
          .then(function(_siteDefinition_){
              siteDefinition = _siteDefinition_;
              fullPageDefinitionPath = path.join(siteDefinition.$basePath, pageDefinitionPath);
              return loadDefinition(fullPageDefinitionPath);
          })
          .then(function(pageDefinition){
              pageDefinition.$basePath = path.dirname(fullPageDefinitionPath);
              for(let dateKey of ['lastModified', 'firstPublished']){
                  if(pageDefinition.hasOwnProperty(dateKey)){
                      pageDefinition[dateKey] = new Date(pageDefinition[dateKey]);
                  }
              }
              return pageDefinition;
          });
    this._pageDefinitions.set(pageDefinitionPath, pageLoadPromise);
    return pageLoadPromise;
};

function loadDefinition(definitionPath){
    return q.when()
        .then(function(){
            return fs.read(definitionPath);
        })
        .then(function(definitionTxt){
            const definition = JSON.parse(definitionTxt);
            definition.$basePath = path.dirname(definitionPath);
            return definition;
        });
}

Renderer.prototype.renderSite = function renderSite(){
    const renderer = this;
    return q.when()
        .then(function(){
            return renderer._siteDefinition;
        })
        .then(function(siteDefinition){
            return q.all([]
                         .concat(siteDefinition.pages.map((p, i) => renderer.renderPage(p, i === 0)))
                         .concat(siteDefinition.articles.map(a => renderer.renderPage(a, false)))
                         .concat(siteDefinition.footer.map(f => renderer.renderPage(f, false)))
                        );
        });
};

Renderer.prototype.renderPage = function renderPage(pagePath, firstPage){
    const renderer = this;
    let pageDirectoryPath, siteDefinition, pageDefinition;
    return q.when()
        .then(function(){
            return renderer._getPageDefinition(pagePath);
        })
        .then(function(_pageDefinition_){
            pageDefinition = _pageDefinition_;
            return renderer._buildPageDirectory(pageDefinition, firstPage);
        })
        .then(function(_pageDirectoryPath_){
            pageDirectoryPath = _pageDirectoryPath_;
            let promises = [
                q.when('<!DOCTYPE html>\n<html>'),
                renderer.renderPageHead(pageDirectoryPath, pageDefinition),
                q.when('<body><div class="ep-container">'),
                renderer.renderPageNavigation(pageDirectoryPath, pageDefinition),
                q.when('<div class="ep-content">'),
            ];
            promises = promises.concat(pageDefinition.content.map(c => renderer.renderPageContentSegment(pageDirectoryPath, pageDefinition, c)));
            promises = promises.concat([
                q.when('</div>'),
                renderer.renderFooter(pageDirectoryPath, pageDefinition),
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

Renderer.prototype._buildPageDirectory = function(pageDefinition, firstPage){
    const renderer = this;
    let pageDirectoryPath;
    return q.when()
        .then(function(){
            return renderer._getPageDirectoryName(pageDefinition, firstPage);
        })
        .then(function(pageDirectoryName){
            pageDirectoryPath = path.join(renderer.outputDir, pageDirectoryName);
            return fs.makeTree(pageDirectoryPath);
        })
        .then(function(){
            return pageDirectoryPath;
        });
};

Renderer.prototype._getPageDirectoryName = function(pageDefinition, firstPage){
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
    ['\'', ''],
    ['"', ''],
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

Renderer.prototype.renderPageHead = function renderPageHead(outputDirPath, pageDefinition){
    const renderer = this;
    return q.when()
        .then(function(){
            return renderer._siteDefinition;
        })
        .then(function(siteDefinition){
            let htmlArtifacts = [
                `<head><meta charset="utf-8"/><meta http-equiv="X-UA-Compatible" content="IE=edge"/><meta name="viewport" content="width=device-width, initial-scale=1"/><title>${pageDefinition.title} - ${siteDefinition.title}</title>`,
            ];
            if(siteDefinition.stylesheets){
                htmlArtifacts = htmlArtifacts.concat(siteDefinition.stylesheets.map(s => `<link rel="stylesheet" type="text/css" href="${s}"/>`));
            }
            htmlArtifacts.push('</head>');
            return htmlArtifacts.join('');
        });
};

Renderer.prototype.renderPageNavigation = function renderPageNavigation(outputDirPath, pageDefinition){
    const renderer = this;
    return q.when()
        .then(function(){
            return q.all([
                q.when('<nav class="ep-page-navigation"><ul>'),
                renderer.renderPageNavigationLinks(outputDirPath, pageDefinition),
                q.when('</ul></nav>'),
            ]);
        })
        .then(function(htmlArtifacts){
            return htmlArtifacts.join('');
        });
};

Renderer.prototype.renderPageNavigationLinks = function renderPageNavigationLinks(outputDirPath, activePageDefinition){
    const renderer = this;
    let siteDefinition, pageDefinitions;
    return q.when()
        .then(function(){
            return renderer._siteDefinition;
        })
        .then(function(_siteDefinition_){
            siteDefinition = _siteDefinition_;
            return q.all(siteDefinition.pages.map(pageDefinitionPath => renderer._getPageDefinition(pageDefinitionPath)));
        })
        .then(function(_pageDefinitions_){
            pageDefinitions = _pageDefinitions_;
            return q.all(pageDefinitions.map((pd, i) => renderer._getPageDirectoryName(pd, i === 0)));
        })
        .then(function(pageDirectoryNames){
            return pageDefinitions.map((pd, i) => `<li><a href="/${pageDirectoryNames[i]}">${escapeHtml(pd.title)}</a></li>`)
                .join('');
        });
};

Renderer.prototype.renderPageContentSegment = function renderPageContentSegment(outputDirPath, pageDefinition, content){
    const renderer = this;
    return q.when()
        .then(function(){
            switch(content.type){
            default:
                return q.reject(new Error('ep.unknownContentSegmentType: ' + content.type));
            case 'articles-archive':
                return renderer._renderPageContentSegmentArticlesArchive(outputDirPath, pageDefinition, content);
            case 'file':
                return renderer._renderPageContentSegmentDownload(outputDirPath, pageDefinition, content);
            case 'headline':
                return renderer._renderPageContentSegmentHeadline(outputDirPath, pageDefinition, content);
            case 'image':
                return renderer._renderPageContentSegmentImage(outputDirPath, pageDefinition, content);
            case 'list':
                return renderer._renderPageContentSegmentList(outputDirPath, pageDefinition, content);
            case 'paragraph':
                return renderer._renderPageContentSegmentParagraph(outputDirPath, pageDefinition, content);
            }
        });
};

Renderer.prototype._renderPageContentSegmentArticlesArchive = function _renderPageContentSegmentArticlesArchive(outputDirPath, pageDefinition, content){
    const renderer = this;
    let articleDefinitions;
    return q.when()
        .then(function(){
            return renderer._siteDefinition;
        })
        .then(function(_siteDefinition_){
            siteDefinition = _siteDefinition_;
            return q.all(siteDefinition.articles.map(articleDefinitionPath => renderer._getPageDefinition(articleDefinitionPath)));
        })
        .then(function(_articleDefinitions_){
            articleDefinitions = _articleDefinitions_;
            return q.all(articleDefinitions.map(ad => renderer._getPageDirectoryName(ad, false)));
        })
        .then(function(articleDirectoryNames){
            const articlesArchiveTreeRootNodes = buildArticlesArchiveTree(content, articleDefinitions, articleDirectoryNames);
            return '<div class="ep-article-archive">' + renderArticlesArchiveTreeNodes(articlesArchiveTreeRootNodes) + '</div>';
        });
};

function buildArticlesArchiveTree(content, articleDefinitions, articleDirectoryNames){
    const articles = articleDefinitions.map((ad, i) => ({
        definition: ad,
        directoryName: articleDirectoryNames[i],
    }));
    if(ARTICLES_COMPARATORS.hasOwnProperty(content.sortOrder)){
        articles.sort(ARTICLES_COMPARATORS[content.sortOrder]);
    }
    if(typeof(content.maxArticles) === 'number' && content.maxArticles >= 0 && content.maxArticles < articles.length){
        articles.splice(content.maxArticles, articles.length - content.maxArticles);
    }
    if(content.groupByFirstPublishYear){
        const years = [];
        let currentYear = null;
        for(let article of articles){
            const articleFirstPublished = article.definition.firstPublished;
            const articleYear = articleFirstPublished ? articleFirstPublished.getFullYear() : null;
            if(currentYear === null || currentYear.year !== articleYear){
                currentYear = {
                    layer: 'first-published-year',
                    year: articleYear,
                    title: `${articleYear}`,
                    children: [],
                };
                years.push(currentYear);
            }
            currentYear.children.push(buildNodeFromArticle(article));
        }
        return years;
    } else {
        return articles.map(buildNodeFromArticle);
    }
}

function buildNodeFromArticle(article){
    return {
        layer: 'article',
        title: article.definition.title,
        href: `/${article.directoryName}`,
    };
}

const ARTICLES_COMPARATORS = {
    firstPublishedDesc: function(left, right){
        const fpl = left.definition.firstPublished;
        const fpr = right.definition.firstPublished;
        return (fpl < fpr) ? 1 : ((fpr < fpl) ? -1 : 0);
    },
};

function renderArticlesArchiveTreeNodes(nodes){
    let htmlFragments = [
        '<ul>',
    ];
    htmlFragments = htmlFragments.concat(nodes.map(function(node){
        if(node.hasOwnProperty('children')){
            // element
            htmlFragments.push('<li class="epe-articles-archive-element ');
            htmlFragments.push(node.layer);
            htmlFragments.push('"><div class="epe-articles-archive-element-title">');
            htmlFragments.push(escapeHtml(node.title));
            htmlFragments.push('</div>');
            htmlFragments.push(renderArticlesArchiveTreeNodes(node.children));
            htmlFragments.push('</li>');
        } else {
            // leaf
            htmlFragments.push('<li class="epe-articles-archive-leaf');
            htmlFragments.push(node.layer);
            htmlFragments.push('"><a href="');
            htmlFragments.push(node.href);
            htmlFragments.push('">');
            htmlFragments.push(escapeHtml(node.title));
            htmlFragments.push('</a></li>');
        }
    }));
    htmlFragments.push('</ul>');
    return htmlFragments.join('');
}

Renderer.prototype._renderPageContentSegmentHeadline = function _renderPageContentSegmentHeadline(outputDirPath, pageDefinition, content){
    return `<h1 class="ep-headline">${escapeHtml(content.text)}</h1>`;
};

const SHEET_SVG = `<svg version="1.0" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
 <g transform="matrix(1.0124 0 0 1.0124 -.37266 -.37266)" stroke-linecap="round" stroke-linejoin="round">
  <g transform="matrix(1.0384 0 0 1.0384 -1.1507 -1.1507)" color="#000000" display="block">
   <path d="m11.75 54.375v-48.75h27.688l8.812 8.813v39.937h-36.5z" fill="none" stroke="#fff" stroke-width="7.1343"/>
   <path d="m11.75 54.375v-48.75h27.688l8.812 8.813v39.937h-36.5z" fill="#fff" stroke="#000" stroke-width="2.3781"/>
   <path d="m39.437 14.438v-8.813l8.813 8.813h-8.813z" stroke="#000" stroke-width="2.3781"/>
  </g>
  <g fill="none" stroke="#000" stroke-width="2.4693">
    <path d="m17.21 32.165h25.58"/>
    <path d="m17.21 37.165h25.58"/>
    <path d="m17.21 42.165h25.58"/>
    <path d="m17.21 47.165h25.58"/>
    <path d="m17.21 27.165h25.58"/>
    <path d="m17.21 22.165h25.58"/>
  </g>
 </g>
</svg>`.replace(/\n/g, '').replace(/[\s]{2,}/g, ' ');

Renderer.prototype._renderPageContentSegmentDownload = function _renderPageContentSegmentDownload(outputDirPath, pageDefinition, content){
    return q.when()
        .then(function(){
            const inputPath = path.join(pageDefinition.$basePath, content.file.resourceName);
            const outputPath = path.join(outputDirPath, content.file.resourceName);
            return fs.copy(inputPath, outputPath);
        })
        .then(function(){
            return `<div class="ep-download"><a href="${escapeHtml(content.file.resourceName)}" download="${escapeHtml(content.file.fileName)}"><div class="ep-download-icon">${SHEET_SVG}</div><div class="ep-download-label">${escapeHtml(content.label || content.file.fileName)}</div></a></div>`;
        });
};

Renderer.prototype._renderPageContentSegmentImage = function _renderPageContentSegmentImage(outputDirPath, pageDefinition, content){
    let renderedImagePath;
    return q.when()
        .then(function(){
            renderedImagePath = path.join(outputDirPath, content.src);
            return images.webifyImage(renderedImagePath, path.join(pageDefinition.$basePath, content.src));
        })
        .then(function(imageResolution){
            return `<div class="ep-image"><img src="${path.basename(renderedImagePath)}"/></div>`;
        });
};

Renderer.prototype._renderPageContentSegmentList = function _renderPageContentSegmentList(outputDirPath, pageDefinition, content){
    let htmlArtifacts = [
        `<ul class="ep-list ep-list-style-${content.style || 'none'}">`,
    ];
    htmlArtifacts = htmlArtifacts.concat(content.lines.map(line => `<li>${eMailAddressMarkupToAnchors(escapeHtml(line))}</li>`));
    htmlArtifacts.push('</ul>');
    return htmlArtifacts.join('');
};

Renderer.prototype._renderPageContentSegmentParagraph = function _renderPageContentSegmentParagraph(outputDirPath, pageDefinition, content){
    const lines = content.text
          .trim()
          .split('\n')
          .map(l => escapeHtml(l.trim()))
          .join('<br/>');
    return `<p class="ep-paragraph">${eMailAddressMarkupToAnchors(lines)}</p>`;
};

function eMailAddressMarkupToAnchors(text){
    const MAIL_PATTERN = /^[^@]+@[^@]+$/;
    const LINK_PATTERN = /^(?:([^|]*)\|)?((?:http|https):\/\/.*)$/;
    return text
        .replace(/\[\[([^\]]+)\]\]/, function(match, linkMarkup){
            linkMarkup = linkMarkup.trim();
            const linkMatch = linkMarkup.match(LINK_PATTERN);
            if(linkMatch){
                return `<a href="${escapeHtml(linkMatch[2])}">${escapeHtml(linkMatch[1])}</a>`;
            }
            const mailMatch = linkMarkup.match(MAIL_PATTERN);
            if(mailMatch){
                return `<a href="mailto:${escapeHtml(linkMarkup)}">${escapeHtml(linkMarkup)}</a>`;
            }
            return escapeHtml(linkMarkup);
        });
}

Renderer.prototype.renderFooter = function renderFooter(outputDirPath, pageDefinition){
    const renderer = this;
    let siteDefinition, pageDefinitions;
    return q.when()
        .then(function(){
            return renderer._siteDefinition;
        })
        .then(function(_siteDefinition_){
            siteDefinition = _siteDefinition_;
            return q.all(siteDefinition.footer.map(f => renderer._getPageDefinition(f)));
        })
        .then(function(_pageDefinitions_){
            pageDefinitions = _pageDefinitions_;
            return q.all(pageDefinitions.map(pd => renderer._getPageDirectoryName(pd, false)));
        })
        .then(function(pageDefinitionPaths){
            let htmlFragments = [
                q.when('<footer class="ep-footer"><ul>'),
            ];
            htmlFragments = htmlFragments.concat(pageDefinitions.map((f, i) => `<li><a href="/${pageDefinitionPaths[i]}">${escapeHtml(f.title)}</a></li>`));
            htmlFragments.push('</ul></footer>');
            return q.all(htmlFragments);
        })
        .then(function(htmlFragments){
            return htmlFragments.join('');
        });
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
