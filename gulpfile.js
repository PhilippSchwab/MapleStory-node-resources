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
      .pipe(sourcemaps.init())
      .pipe(ts({
          declaration: true,
          target: 'es2017',
          module: 'commonjs'
      }));
  return merge([
      tsResult.dts.pipe(gulp.dest('./')),
      tsResult.js.pipe(sourcemaps.write()).pipe(gulp.dest('./'))
  ]);
});

gulp.task('compile', ['coffee-compile', 'type-compile']);
