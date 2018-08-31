import {Component} from '@angular/core';

import {NaiscItemContent} from './shared';


@Component({
  template: '<!-- No Content -->'
})
export class NaiscDefaultItemComponent extends NaiscItemContent {
  public get title(): string {
    return this.item.state['title'] as string || 'Missing Node Name';
  }
}
