import {Component} from '@angular/core';

import {NaiscItemContent} from './shared/naisc-item-content';


@Component({
  template: '<!-- No Content -->'
})
export class NaiscDefaultItemComponent extends NaiscItemContent {
  public getTitle(): string {
    return this.item.state['title'] as string || '** No Title **';
  }

  getInputPinName(idx: number): string {
    return this.item.state['pins-in'] && this.item.state['pins-in'][idx] || '** No Name **';
  }

  getOutputPinName(idx: number): string {
    return this.item.state['pins-out'] && this.item.state['pins-out'][idx] || '** No Name **';
  }
}
