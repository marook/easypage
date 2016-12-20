const concat = require('gulp-concat');
const gulp = require('gulp');

gulp.task('default', ['build']);

gulp.task('build', ['html-to-www', 'css-to-www', 'lib-js-to-www', 'app-js-to-www', 'fonts-to-www']);

gulp.task('html-to-www', function(){
    return gulp.src('ui/**/*.html')
        .pipe(gulp.dest('www'));
});

gulp.task('css-to-www', function(){
    return gulp.src([
        'node_modules/bootstrap/dist/css/bootstrap.min.css',
        'ui/**/*.css',
    ])
        .pipe(concat('style.css'))
        .pipe(gulp.dest('www'));
});

gulp.task('lib-js-to-www', function(){
    return gulp.src([
        'node_modules/angular/angular.min.js',
        'node_modules/angular-ui-bootstrap/dist/ui-bootstrap-tpls.js',
        'node_modules/angular-ui-router/release/angular-ui-router.min.js',
    ])
        .pipe(concat('lib.js'))
        .pipe(gulp.dest('www'))
});

gulp.task('app-js-to-www', function(){
    return gulp.src([
        'ui.js',
        'ui/**/*.js',
    ])
        .pipe(concat('app.js'))
        .pipe(gulp.dest('www'))
});

gulp.task('fonts-to-www', function(){
    return gulp.src([
        'node_modules/bootstrap/dist/fonts/**/*',
    ])
        .pipe(gulp.dest('www/fonts'));
});

gulp.task('connect', function(){
    const connect = require('gulp-connect');
    const proxy = require('http-proxy-middleware');
    connect.server({
        port: 9001,
        root: 'www',
        middleware: function(connect, opt){
            return [
                proxy('/api', {
                    target: 'http://localhost:9002',
                    pathRewrite: {
                        '^/api': '',
                    },
                }),
            ];
        },
    });
});
