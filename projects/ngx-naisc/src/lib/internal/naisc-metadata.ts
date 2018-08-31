import {Type} from '@angular/core';
import {NaiscItemDescriptor} from '../shared';


export const METADATA_ACCESSOR = '__naisc__';

export interface NaiscMetadata {
  type: string;
  factory: () => NaiscItemDescriptor;
}

export function validateNaiscContent(contentClass: Type<any>): void {
  if (!(METADATA_ACCESSOR in contentClass) || !contentClass[METADATA_ACCESSOR].type) {
    throw new Error(`Invalid Naisc content class, ${contentClass.name}`);
  }
}
