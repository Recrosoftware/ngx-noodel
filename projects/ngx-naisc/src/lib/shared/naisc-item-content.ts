import {Input} from '@angular/core';
import {Observable} from 'rxjs';

import {NaiscItemDescriptor} from './naisc-item-descriptor';


export abstract class NaiscItemContent {
  @Input() public item: NaiscItemDescriptor;

  public abstract getTitle(): string | Promise<string> | Observable<string>;

  public abstract getPinName(type: 'in' | 'out', idx: number): string | Promise<string> | Observable<string>;
}
