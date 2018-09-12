const {join} = require('path');
const {spawn} = require('child_process');

const gulp = require('gulp');
const clean = require('gulp-clean');

const PROJECT_ROOT = __dirname;

const NG = `"${join(PROJECT_ROOT, 'node_modules', '.bin', 'ng')}"`;
const DEST = join(PROJECT_ROOT, 'dist', 'ngx-naisc');

export async function build() {
  // TODO
  // const process = spawn(NG, ['ngx-naisc', '--prod']);
}
