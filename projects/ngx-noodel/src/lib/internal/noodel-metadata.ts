import {Type} from '@angular/core';
import {NoodelItemDescriptor} from '../shared';


export const METADATA_ACCESSOR = '__noodel__';

export interface NoodelMetadata {
  type: string;
  factory: () => NoodelItemDescriptor;
}

export function validateNoodelContent(contentClass: Type<any>): void {
  if (!(METADATA_ACCESSOR in contentClass) || !contentClass[METADATA_ACCESSOR].type) {
    throw new Error(`Invalid Noodel content class, ${contentClass.name}`);
  }
}
