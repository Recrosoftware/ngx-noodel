import {Component} from '@angular/core';

import {NaiscItemContent} from './shared';


@Component({
  template: '<!-- No Content -->'
})
export class NaiscDefaultItemComponent extends NaiscItemContent {
  public getTitle(): string {
    return this.item.state['title'] as string || '** No Title **';
  }

  public getPinName(type: 'in' | 'out', idx: number): string {
    return this.item.state[`pins-${type}`] && this.item.state[`pins-${type}`][idx] || '** No Name **';
  }
}
