// generated on 2016-08-13 using generator-chrome-extension 0.5.6
import gulp from 'gulp';
import gulpLoadPlugins from 'gulp-load-plugins';
import del from 'del';
import runSequence from 'run-sequence';
import {stream as wiredep} from 'wiredep';

const $ = gulpLoadPlugins();

gulp.task('extras', (cb) => {
  gulp.src([
    'app/*.*',
    'app/_locales/**',
    '!app/scripts.babel',
    '!app/*.json',
    '!app/*.html',
    '!app/styles.scss'
  ], {
    base: 'app',
    dot: true
  }).pipe(gulp.dest('dist'));
  cb();
});

function lint(files, options) {
  return () => {
    return gulp.src(files)
      .pipe($.eslint(options))
      .pipe($.eslint.format());
  };
}

gulp.task('lint', lint('app/scripts.babel/**/*.js', {
  env: {
    es6: true
  }
}));

gulp.task('images', (cb) => {
  gulp.src('app/images/**/*')
    .pipe($.if($.if.isFile, $.cache($.imagemin({
      progressive: true,
      interlaced: true,
      // don't remove IDs from SVGs, they are often used
      // as hooks for embedding and styling
      svgoPlugins: [{cleanupIDs: false}]
    }))
    .on('error', function (err) {
      console.log(err);
      this.end();
    })))
    .pipe(gulp.dest('dist/images'));
  cb();
});
gulp.task('styles', (cb) => {
  gulp.src('app/styles.scss/*.scss')
    .pipe($.plumber())
    .pipe($.sass.sync({
      outputStyle: 'expanded',
      precision: 10,
      includePaths: ['.']
    }).on('error', $.sass.logError))
    .pipe(gulp.dest('app/styles'));
  cb();
});

gulp.task('html', gulp.series('styles', (cb) => {
  gulp.src('app/*.html')
    .pipe($.useref({searchPath: ['.tmp', 'app', '.']}))
    .pipe($.sourcemaps.init())
    .pipe($.if('*.js', $.uglify()))
    .pipe($.if('*.css', $.cleanCss({compatibility: '*'})))
    .pipe($.sourcemaps.write())
    .pipe($.if('*.html', $.htmlmin({removeComments: true, collapseWhitespace: true})))
    .pipe(gulp.dest('dist'));
  cb();
}));

gulp.task('chromeManifest', (cb) => {
  gulp.src('app/manifest.json')
    .pipe($.chromeManifest({
      buildnumber: false,
      background: {
        target: 'scripts/background.js',
        exclude: [
          'scripts/chromereload.js'
        ]
      }
  }))
  .pipe($.if('*.css', $.cleanCss({compatibility: '*'})))
  .pipe($.if('*.js', $.sourcemaps.init()))
  .pipe($.if('*.js', $.uglify()))
  .pipe($.if('*.js', $.sourcemaps.write('.')))
  .pipe(gulp.dest('dist'));
  cb();
});

gulp.task('babel', (cb) => {
  gulp.src('app/scripts.babel/**/*.js')
      .pipe($.babel({
        presets: ['es2015']
      }))
      .pipe(gulp.dest('app/scripts'));
  cb();
});

gulp.task('clean', (cb) => {
  del.bind(null, ['.tmp', 'dist']);
  cb();
});

gulp.task('watch', gulp.series('lint', 'babel', 'html', (cb) => {
  $.livereload.listen();

  gulp.watch([
    'app/*.html',
    'app/scripts/**/*.js',
    'app/images/**/*',
    'app/styles/**/*',
    'app/_locales/**/*.json'
  ]).on('change', $.livereload.reload);

  gulp.watch('app/scripts.babel/**/*.js', ['lint', 'babel']);
  gulp.watch('app/styles.scss/**/*.scss', ['styles']);
  gulp.watch('bower.json', ['wiredep']);
  cb();
}));

gulp.task('size', (cb) => {
  gulp.src('dist/**/*').pipe($.size({title: 'build', gzip: true}));
  cb();
});

gulp.task('wiredep', (cb) => {
  gulp.src('app/*.html')
    .pipe(wiredep({
      ignorePath: /^(\.\.\/)*\.\./
    }))
    .pipe(gulp.dest('app'));
  cb();
});

gulp.task('package', (cb) => {
  var manifest = require('./dist/manifest.json');
  gulp.src('dist/**')
      .pipe($.zip('octomerge-' + manifest.version + '.zip'))
      .pipe(gulp.dest('package'));
  cb();
});

gulp.task('build', gulp.series('lint', 'babel', 'chromeManifest', 'html', 'images', 'extras', 'size', (cb) => {
  cb();
}));

gulp.task('default', gulp.series('clean', 'build', cb => {
  cb();
}));
