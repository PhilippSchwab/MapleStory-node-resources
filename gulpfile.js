const gulp = require('gulp');
// const exec = require('child_process').exec;
const coffee = require('gulp-coffee2');
const sourcemaps = require('gulp-sourcemaps');
const changed = require('gulp-changed');
// const clean = require('gulp-clean');

gulp.task('coffee-compile', function () {
  gulp.src(['**/*.coffee','!./node_modules/**'], {base: "./"})
    .pipe(changed('./**'))
    .pipe(sourcemaps.init())
    .pipe(coffee({bare: true}))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest((file) => (file.base)));
});
