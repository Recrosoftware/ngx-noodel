const {join} = require('path');
const {spawn} = require('child_process');

const gulp = require('gulp');
const sass = require('gulp-sass');

const PROJECT_ROOT = __dirname;

const NG = `"${join(PROJECT_ROOT, 'node_modules', '.bin', 'ng')}"`;

const N_CORE = join(PROJECT_ROOT, 'projects', 'naisc-core');
const N_CORE_DEST = join(PROJECT_ROOT, 'dist', 'naisc-core');

function build() {
  return new Promise(resolve => {
    console.log();
    const buildProc = spawn(NG, ['build', 'naisc-core', '--prod'], {
      cwd: PROJECT_ROOT,
      shell: true,
      stdio: 'inherit',
      env: process.env
    });
    process.on('exit', () => buildProc.kill());
    buildProc.on('exit', () => {
      console.log();
      resolve();
    });
  });
}

function themesBuild() {
  const source = join(N_CORE, 'src', 'resources', 'themes', 'pre-built', '*.scss');
  const target = join(N_CORE_DEST, 'themes', 'pre-built');

  return gulp.src(source)
    .pipe(sass({outputStyle: 'compressed'}).on('error', sass.logError))
    .pipe(gulp.dest(target));
}

function themesCopyBuilder() {
  const source = join(N_CORE, 'src', 'resources', 'themes', '*.scss');
  const target = join(N_CORE_DEST, 'themes');

  return gulp.src(source).pipe(gulp.dest(target));
}

gulp.task('themes:build', themesBuild);
gulp.task('themes:copy-builder', themesCopyBuilder);
gulp.task('themes', gulp.series('themes:build', 'themes:copy-builder'));

gulp.task('build:compile', build);
gulp.task('build', gulp.series('build:compile', 'themes'));
