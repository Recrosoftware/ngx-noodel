import {NaiscExtent} from './naisc-extent';
import {NaiscItemDescriptor} from './naisc-item-descriptor';


export type NaiscValidationError = { [key: string]: any; } | null;

export interface NaiscValidationResult {
  item: NaiscItemDescriptor;
  errors: NaiscValidationError;
  extent: NaiscExtent;
}
