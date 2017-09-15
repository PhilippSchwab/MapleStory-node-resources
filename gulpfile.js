const gulp = require('gulp');
// const exec = require('child_process').exec;
const coffee = require('gulp-coffee2');
const sourcemaps = require('gulp-sourcemaps');
const changed = require('gulp-changed');
const ts = require('gulp-typescript');
const merge = require('merge2');
// const clean = require('gulp-clean');

gulp.task('coffee-compile', function () {
  gulp.src(['**/*.coffee','!./node_modules/**'], {base: "./"})
    .pipe(changed('./**'))
    .pipe(sourcemaps.init())
    .pipe(coffee({bare: true}))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest((file) => (file.base)));
});

gulp.task('type-compile', function() {
  var tsResult = gulp.src(['**/*.ts','!./node_modules/**'])
      .pipe(ts({
          declaration: true,
          // allowJs: true
      }));

  return merge([
      tsResult.dts.pipe(gulp.dest('./')),
      tsResult.js.pipe(gulp.dest('./'))
  ]);
});
