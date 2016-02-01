// All used modules.
var gulp = require('gulp');
var babel = require('gulp-babel');
var browserify = require('gulp-browserify');
var actualBrowserify = require('browserify');
var babelify = require('babelify');
var source = require('vinyl-source-stream');
var runSeq = require('run-sequence');
var plumber = require('gulp-plumber');
var concat = require('gulp-concat');
var rename = require('gulp-rename');
var sass = require('gulp-sass');
var livereload = require('gulp-livereload');
var minifyCSS = require('gulp-minify-css');
var ngAnnotate = require('gulp-ng-annotate');
var uglify = require('gulp-uglify');
var sourcemaps = require('gulp-sourcemaps');
var eslint = require('gulp-eslint');
var mocha = require('gulp-mocha');
var karma = require('karma').server;
var istanbul = require('gulp-istanbul');
var notify = require('gulp-notify');

// Development tasks
// --------------------------------------------------------------

gulp.task('bb', function() {
  var bundler = actualBrowserify();

  bundler.add('./browser/js/app.js');

  bundler.transform(babelify);

  return bundler.bundle()
    .pipe(source('main.js'))
    .pipe(plumber())
    .pipe(gulp.dest('./public'));
})

// Live reload business.
gulp.task('reload', function() {
  livereload.reload();
});

gulp.task('reloadCSS', function() {
  return gulp.src('./public/style.css').pipe(livereload());
});

gulp.task('lintBrowserJS', function() {

  return gulp.src(['./browser/js/**/*.js'])
    .pipe(plumber({
      errorHandler: notify.onError('Linting FAILED! Check your gulp process.')
    }))
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failOnError());

});

gulp.task('lintGameJS', function() {

  return gulp.src(['./game/js/**'])
    .pipe(plumber({
      errorHandler: notify.onError('Linting FAILED! Check your gulp process.')
    }))
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failOnError());

});

gulp.task('lintServerJS', function() {

  return gulp.src(['./server/**/*.js'])
    .pipe(plumber({
      errorHandler: notify.onError('Linting FAILED! Check your gulp process.')
    }))
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failOnError());

});

// gulp.task('buildBrowserJS', ['lintBrowserJS'], function() {
//   return gulp.src(['./browser/js/app.js', './browser/js/**/*.js'])
//     .pipe(plumber())
//     .pipe(sourcemaps.init())
//     .pipe(babel())
//     .pipe(browserify({
//       insertGlobals: true,
//       debug: !gulp.env.production
//     }))
//     .pipe(sourcemaps.write())
//     .pipe(rename('main.js'))
//     .pipe(gulp.dest('./public'));
// });

gulp.task('buildGameJS', ['lintGameJS'], function() {
  return gulp.src(['./game/js/main.js'])
    .pipe(plumber())
    .pipe(babel())
    .pipe(browserify({
      insertGlobals: true,
      debug: !gulp.env.production
    }))
    .pipe(rename('girder-gus.js'))
    .pipe(gulp.dest('./public'));
});

gulp.task('copyAssets', function() {
  return gulp.src(['./game/assets/**'])
    .pipe(plumber())
    .pipe(gulp.dest('./public/assets'));
});

gulp.task('testServerJS', function() {
  require('babel/register');
  return gulp.src('./tests/server/**/*.js', {
    read: false
  }).pipe(mocha({
    reporter: 'spec'
  }));
});

gulp.task('testServerJSWithCoverage', function(done) {
  gulp.src('./server/**/*.js')
    .pipe(istanbul({
      includeUntested: true
    }))
    .pipe(istanbul.hookRequire())
    .on('finish', function() {
      gulp.src('./tests/server/**/*.js', {
          read: false
        })
        .pipe(mocha({
          reporter: 'spec'
        }))
        .pipe(istanbul.writeReports({
          dir: './coverage/server/',
          reporters: ['html', 'text']
        }))
        .on('end', done);
    });
});

gulp.task('testBrowserJS', function(done) {
  karma.start({
    configFile: __dirname + '/tests/browser/karma.conf.js',
    singleRun: true
  }, done);
});

gulp.task('buildCSS', function() {

  var sassCompilation = sass();
  sassCompilation.on('error', console.error.bind(console));

  return gulp.src('./browser/sass/main.sass')
    .pipe(plumber({
      errorHandler: notify.onError('SASS processing failed! Check your gulp process.')
    }))
    .pipe(sourcemaps.init())
    .pipe(sassCompilation)
    .pipe(rename('style.css'))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('./public'));
});

// Production tasks
// --------------------------------------------------------------

gulp.task('buildCSSProduction', function() {
  return gulp.src('./browser/scss/main.scss')
    .pipe(sass())
    .pipe(rename('style.css'))
    .pipe(minifyCSS())
    .pipe(gulp.dest('./public'))
});

gulp.task('buildJSProduction', function() {
  return gulp.src(['./browser/js/app.js', './browser/js/**/*.js'])
    .pipe(concat('main.js'))
    .pipe(babel())
    .pipe(ngAnnotate())
    .pipe(uglify())
    .pipe(gulp.dest('./public'));
});

gulp.task('buildProduction', ['buildCSSProduction', 'buildJSProduction']);

// Composed tasks
// --------------------------------------------------------------

gulp.task('build', function() {
  if (process.env.NODE_ENV === 'production') {
    runSeq(['buildJSProduction', 'buildCSSProduction']);
  } else {
    runSeq(['bb', 'buildGameJS', 'buildCSS', 'copyAssets']);
  }
});

// todo: add tests
gulp.task('travis', ['lintServerJS', 'buildBrowserJS', 'buildGameJS', 'buildCSS', 'copyAssets'], function() {
  process.exit(0);
});

gulp.task('default', function() {

  gulp.start('build');

  // Run when anything inside of browser/js changes.
  gulp.watch('browser/js/**', function() {
    runSeq('bb', 'reload');
  });

  gulp.watch('game/js/**', function() {
    runSeq('buildGameJS', 'reload');
  });

  // Run when anything inside of browser/scss changes.
  gulp.watch('browser/sass/**', function() {
    runSeq('buildCSS', 'reloadCSS');
  });

  gulp.watch('server/**/*.js', ['lintServerJS']);

  // Reload when a template (.html) file changes.
  gulp.watch(['browser/**/*.html', 'server/app/views/*.html'], ['reload']);

  // Run server tests when a server file or server test file changes.
  gulp.watch(['tests/server/**/*.js'], ['testServerJS']);

  // Run browser testing when a browser test file changes.
  gulp.watch('tests/browser/**/*', ['testBrowserJS']);

  livereload.listen();

});
