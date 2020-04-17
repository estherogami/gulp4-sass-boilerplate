// Requires Gulp v4.
// $ npm uninstall --global gulp gulp-cli
// $ rm /usr/local/share/man/man1/gulp.1
// $ npm install --global gulp-cli
// $ npm install
const { src, dest, watch, series, parallel } = require('gulp');
const browsersync = require('browser-sync').create();
const sass = require('gulp-sass');
const sourcemaps = require('gulp-sourcemaps');
const plumber = require('gulp-plumber');
const sasslint = require('gulp-sass-lint');
const cache = require('gulp-cached');
const notify = require('gulp-notify');
const beeper = require('beeper');
const concat = require('gulp-concat');
const uglify = require('gulp-uglify');

const files = { 
  scssPath: 'app/scss/**/*.scss',
  jsPath: 'app/js/**/*.js',
  htmlPath: 'app/*.html'
}

// Compile CSS from Sass.
function buildStyles() {
  return src(files.scssPath)
    .pipe(plumbError()) // Global error handler through all pipes.
    .pipe(sourcemaps.init())
    .pipe(sass({ outputStyle: 'compressed' }))
    .pipe(sourcemaps.write())
    .pipe(dest('dist/css'))
    .pipe(browsersync.reload({ stream: true }));
}

// JS task: concatenates and uglifies JS files to script.js
function buildJs(){
  return src([
      files.jsPath
      //,'!' + 'includes/js/jquery.min.js', // to exclude any specific files
      ])
      .pipe(concat('all.js'))
      .pipe(uglify())
      .pipe(dest('dist/js'))
      .pipe(browsersync.reload({ stream: true }));
}

// Watch changes on all *.scss files, lint them and
// trigger buildStyles() at the end.
function watchFiles() {
  watch(
    [files.scssPath, files.jsPath, files.htmlPath],
    { events: 'all', ignoreInitial: false },
    series(sassLint, buildStyles, buildJs)
  );
}

// Init BrowserSync.
function browserSync(done) {
  browsersync.init({
    server: {
      baseDir: "./"
    },
    port: 3000
  });
  done();
}

// Init Sass linter.
function sassLint() {
  return src(['scss/*.scss', 'scss/**/*.scss'])
    .pipe(cache('sasslint'))
    .pipe(sasslint({
      configFile: '.sass-lint.yml'
    }))
    .pipe(sasslint.format())
    .pipe(sasslint.failOnError());
}

// Error handler.
function plumbError() {
  return plumber({
    errorHandler: function(err) {
      notify.onError({
        templateOptions: {
          date: new Date()
        },
        title: "Gulp error in " + err.plugin,
        message:  err.formatted
      })(err);
      beeper();
      this.emit('end');
    }
  })
}


// Optimize Images
function images() {
  return gulp
    .src("./assets/img/**/*")
    .pipe(newer("./_site/assets/img"))
    .pipe(
      imagemin([
        imagemin.gifsicle({ interlaced: true }),
        imagemin.jpegtran({ progressive: true }),
        imagemin.optipng({ optimizationLevel: 5 }),
        imagemin.svgo({
          plugins: [
            {
              removeViewBox: false,
              collapseGroups: true
            }
          ]
        })
      ])
    )
    .pipe(gulp.dest("./_site/assets/img"))
    .pipe(browsersync.reload({ stream: true }));

}

// Export commands.
exports.default = parallel(browserSync, watchFiles); // $ gulp
exports.sass = buildStyles; // $ gulp sass
exports.js = buildJs; // $ gulp js
//exports.watch = watchFiles; // $ gulp watch
//exports.build = series(buildStyles); // $ gulp build