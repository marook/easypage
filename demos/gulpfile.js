const connect = require('gulp-connect');
const del = require('del');
const gulp = require('gulp');
const less = require('gulp-less');
const renderer = require('../renderer');

gulp.task('default', ['build']);

gulp.task('build', ['render-site', 'render-css']);

gulp.task('connect', function(){
    connect.server({
        port: 9003,
        root: 'www',
    });
});

gulp.task('render-site', ['clean-www'], function(){
    return renderer.renderSite('www', 'site.json');
});

gulp.task('render-css', ['clean-www'], function(){
    return gulp.src('demo.less')
        .pipe(less())
        .pipe(gulp.dest('www'));
});

gulp.task('clean-www', function(){
    return del('www');
});
