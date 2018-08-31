import {Input} from '@angular/core';
import {Observable} from 'rxjs';

import {NaiscItemDescriptor} from './naisc-item-descriptor';


export abstract class NaiscItemContent {
  @Input() public item: NaiscItemDescriptor;

  public abstract readonly title: string | Promise<string> | Observable<string>;
}
