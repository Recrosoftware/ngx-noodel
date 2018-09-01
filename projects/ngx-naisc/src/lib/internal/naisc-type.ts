import {Type} from '@angular/core';

import {NaiscItemContent} from '../shared/naisc-item-content';
import {NaiscMetadata} from './naisc-metadata';
import {NAISC_METADATA_ACCESSOR} from './symbols';


export type NaiscType = Type<NaiscItemContent> & {
  [NAISC_METADATA_ACCESSOR]?: NaiscMetadata;
};
