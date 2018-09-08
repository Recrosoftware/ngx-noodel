import {Input} from '@angular/core';
import {Observable} from 'rxjs';

import {NaiscItemDescriptor} from './naisc-item-descriptor';


export abstract class NaiscItemContent {
  @Input() public item: NaiscItemDescriptor;

  public abstract getTitle(): string | Promise<string> | Observable<string>;

  public abstract getInputPinName(idx: number): string | Promise<string> | Observable<string>;
  public abstract getOutputPinName(idx: number): string | Promise<string> | Observable<string>;

  public isPermanent(): boolean | Promise<boolean> | Observable<boolean> {
    return false;
  }
}
