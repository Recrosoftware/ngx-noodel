import {Component} from '@angular/core';

import {NoodelItemContent} from './shared';


@Component({
  template: '<!-- No Content -->'
})
export class NoodelDefaultItemComponent extends NoodelItemContent {
  public get title(): string {
    return this.item.state['title'] as string || 'Missing Node Name';
  }
}
