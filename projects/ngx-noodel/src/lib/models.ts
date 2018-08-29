import {Input, Type} from '@angular/core';


export interface ViewProjection {
  x?: number;
  y?: number;
  z?: number;
}

export interface NoodelItemDescriptor {
  type: string;
  position: { x: number, y: number };

  state: { [key: string]: string | number | boolean | string[] | number[] | boolean[] };
}

export abstract class NoodelItemContent {
  @Input() public item: NoodelItemDescriptor;

  public abstract readonly title: string;
}

export interface NoodelContentTemplate {
  itemType: string;
  component: Type<NoodelItemContent>;
}
