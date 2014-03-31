/*
  Gulp.js configuration
  Minifies changed images, compiles Sass, auto-prefixes and LiveReloads

  npm install --save-dev gulp-changed gulp-clean gulp-sass gulp-autoprefixer gulp-imagemin gulp-livereload

  LiveReload browser extensions:
  http://feedback.livereload.com/knowledgebase/articles/86242-how-do-i-install-and-use-the-browser-extensions-
*/

// include gulp
var gulp = require('gulp');

// include plug-ins
var
  changed = require('gulp-changed'),
  clean = require('gulp-clean'),
  sass = require('gulp-sass'),
  autoprefix = require('gulp-autoprefixer'),
  imagemin = require('gulp-imagemin'),
  livereload = require('gulp-livereload');

// constants
var
  src = './src/',
  dst = './',
  images = {
    'in':  src + 'images/**/*',
    'out': dst + 'images/'
  },
  css = {
    'in':  src + 'scss/**/*',
    'out': dst + 'css/'
  },
  js = {
    'out': dst + 'js/'
  };

var update = [dst + '*', js.out + '*'];

// minify images
gulp.task('images', function() {
  return gulp.src(images.in)
    .pipe(changed(images.out))
    .pipe(imagemin())
    .pipe(gulp.dest(images.out));
});

// clean CSS folder
gulp.task('cleancss', function() {
  return gulp.src(css.out, {read: false})
    .pipe(clean());
});

// compile Sass
gulp.task('sass', ['cleancss'], function() {
  return gulp.src(css.in)
    .pipe(sass({errLogToConsole: true}))
    .pipe(autoprefix("last 1 version", "> 1%", "ie 8"))
    .pipe(gulp.dest(css.out))
    .pipe(livereload());
});

// live reload
gulp.task('reload', function() {
  return gulp.src(update)
    .pipe(livereload());
});

// default task
gulp.task('default', ['sass', 'images', 'reload'], function() {

  // CSS changes
  gulp.watch(css.in, ['sass']);

  // image changes
  gulp.watch(images.in, ['images']);

  // any change
  gulp.watch(update, ['reload']);

});
