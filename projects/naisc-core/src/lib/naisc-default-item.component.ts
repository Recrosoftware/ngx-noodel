import {Component} from '@angular/core';

import {NaiscItemContent} from './shared/naisc-item-content';


@Component({
  template: '<!-- No Content -->'
})
export class NaiscDefaultItemComponent extends NaiscItemContent {
  public getTitle(): string {
    return ('title' in this.item.state) ? this.item.state['title'] as string : '** No Title **';
  }

  public getInputPinName(idx: number): string {
    return ('pins-in' in this.item.state) ? this.item.state['pins-in'][idx] as string : '** No Name **';
  }

  public getOutputPinName(idx: number): string {
    return ('pins-out' in this.item.state) ? this.item.state['pins-out'][idx] as string : '** No Name **';
  }

  public isPermanent(): boolean {
    return !!this.item.state['permanent'];
  }
}
