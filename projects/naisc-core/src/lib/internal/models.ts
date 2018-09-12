import {ComponentRef, Type} from '@angular/core';
import {NaiscItemComponent} from '../naisc-item.component';
import {NaiscItemContent} from '../shared/naisc-item-content';
import {NaiscItemDescriptor, NaiscPinDescriptor} from '../shared/naisc-item-descriptor';
import {NAISC_METADATA_ACCESSOR} from './symbols';


export interface NaiscItemInstanceRef {
  ref: ComponentRef<NaiscItemComponent>;
  data: NaiscItemDescriptor;
}

export interface NaiscItemLink {
  from: NaiscItemLinkRef;
  to: NaiscItemLinkRef;
}

export interface NaiscItemLinkRef {
  item: NaiscItemDescriptor;
  pin: NaiscPinDescriptor;
}

export type NaiscLinkEvent = NaiscLinkEventStart | NaiscLinkEventEnd | NaiscLinkEventAdd | NaiscLinkEventRemove;

export interface NaiscLinkEventStart {
  actionType: 'start';
  ref: NaiscItemLinkRef;
}

export interface NaiscLinkEventEnd {
  actionType: 'end';
}

export interface NaiscLinkEventAdd {
  actionType: 'add';
  refFrom: NaiscItemLinkRef;
  refTo: NaiscItemLinkRef;
}

export interface NaiscLinkEventRemove {
  actionType: 'remove';
  refFrom: NaiscItemLinkRef;
  refTo: NaiscItemLinkRef;
}

export class NaiscMetadata {
  public type: string[];
  public factory: () => NaiscItemDescriptor;
}

export type NaiscType = Type<NaiscItemContent> & {
  [NAISC_METADATA_ACCESSOR]?: NaiscMetadata;
};

export interface ViewProjection {
  x?: number;
  y?: number;
  z?: number;
}
