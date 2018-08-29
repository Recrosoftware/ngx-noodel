import {Component} from '@angular/core';
import {NoodelItemContent} from './noodel-item.content';


@Component({
  template: '<!-- No Content -->'
})
export class NoodelDefaultItemComponent extends NoodelItemContent {
  public get title(): string {
    return this.item.state['title'] as string;
  }
}
