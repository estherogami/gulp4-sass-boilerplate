// Initialize modules

// Importing specific gulp API functions lets us write them below as series() instead of gulp.series()
const { src, dest, watch, series, parallel } = require('gulp');
// Importing all the Gulp-related packages we want to use
const sourcemaps = require('gulp-sourcemaps');
const sass = require('gulp-sass');
const concat = require('gulp-concat');
const uglify = require('gulp-uglify');
const postcss = require('gulp-postcss');
const autoprefixer = require('autoprefixer');
const browsersync = require('browser-sync').create();
const cssnano = require('cssnano');
var replace = require('gulp-replace');


// File paths
const files = { 
    scssPath: 'app/scss/**/*.scss',
    jsPath: 'app/js/**/*.js',
    htmlPath: 'app/*.html'
}

// Sass task: compiles the style.scss file into style.css
function scssTask(){    
    return src(files.scssPath)
        .pipe(sourcemaps.init()) // initialize sourcemaps first
        .pipe(sass().on('error',sass.logError))// compile SCSS to CSS
        .pipe(postcss([ autoprefixer(), cssnano() ])) // PostCSS plugins
        .pipe(sourcemaps.write('.')) // write sourcemaps file in current directory
        .pipe(dest('dist')    ) // put final CSS in dist folder
        .pipe(browsersync.reload({ stream: true }));
}

// JS task: concatenates and uglifies JS files to script.js
function jsTask(){
    return src([
        files.jsPath
        //,'!' + 'includes/js/jquery.min.js', // to exclude any specific files
        ])
        .pipe(concat('all.js'))
        .pipe(uglify())
        .pipe(dest('dist'))
        .pipe(browsersync.reload({ stream: true }));
}

// Cachebust
function cacheBustTask(){
    var cbString = new Date().getTime();
    return src(['index.html'])
        .pipe(replace(/cb=\d+/g, 'cb=' + cbString))
        .pipe(dest('.'))
        .pipe(browsersync.reload({ stream: true }));
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

// Watch task: watch SCSS and JS files for changes
// If any change, run scss and js tasks simultaneously
function watchTask(){
    watch([files.scssPath, files.jsPath, files.htmlPath],
        {interval: 1000, usePolling: true}, //Makes docker work
        series(
            parallel(scssTask, jsTask),
            cacheBustTask
        )
    );    
}

// Export the default Gulp task so it can be run
// Runs the scss and js tasks simultaneously
// then runs cacheBust, then watch task
exports.default = series(
    parallel(scssTask, jsTask, browserSync), 
    cacheBustTask,
    watchTask
);