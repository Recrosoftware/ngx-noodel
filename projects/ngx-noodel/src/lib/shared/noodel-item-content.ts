import {Input} from '@angular/core';
import {Observable} from 'rxjs';

import {NoodelItemDescriptor} from './noodel-item-descriptor';


export abstract class NoodelItemContent {
  @Input() public item: NoodelItemDescriptor;

  public abstract readonly title: string | Promise<string> | Observable<string>;
}
