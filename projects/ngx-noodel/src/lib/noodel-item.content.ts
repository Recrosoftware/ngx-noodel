import {Input} from '@angular/core';
import {NoodelItemDescriptor} from './models';


export abstract class NoodelItemContent {
  @Input() public item: NoodelItemDescriptor;

  public abstract readonly title: string;
}
