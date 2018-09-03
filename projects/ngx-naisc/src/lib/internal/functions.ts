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
