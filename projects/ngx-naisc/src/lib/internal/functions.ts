import {ɵstringify as stringify} from '@angular/core';
import {NaiscItemContent} from '../shared/naisc-item-content';
import {NaiscMetadata, NaiscType} from './models';
import {NAISC_METADATA_ACCESSOR} from './symbols';


export function validateNaiscContent(contentClass: NaiscType): void {
  if (!(contentClass.prototype instanceof NaiscItemContent)) {
    throw new Error(`Invalid custom item content class: ${stringify(contentClass)}`);
  }

  if (!(contentClass[NAISC_METADATA_ACCESSOR] instanceof NaiscMetadata)) {
    throw new Error(`Invalid custom item content class: ${stringify(contentClass)}`);
  }
}

let MICROTASK_ID = 0;
const MICROTASKS: { [id: number]: boolean } = {};

export function cancelAsyncTask(id: number): void {
  window.clearTimeout(id);
}

export function cancelAsyncMicrotask(id: number): void {
  delete MICROTASKS[id];
}

export function runAsyncTask(fn: (...args: any[]) => any, applyThis?: any, applyArgs?: any[]): number {
  return window.setTimeout(() => {
    fn.apply(applyThis, applyArgs);
  });
}

export function runAsyncMicrotask(fn: (...args: any[]) => any, applyThis?: any, applyArgs?: any[]): number {
  const id = MICROTASK_ID++;

  MICROTASKS[id] = true;

  Promise.resolve()
    .then(() => {
      if (id in MICROTASKS) {
        fn.apply(applyThis, applyArgs);
      }
    });

  return id;
}
