import {Component} from '@angular/core';
import {NoodelItem, NoodelItemContent} from 'ngx-noodel';


@Component({
  template: `
    Hello World
  `
})
@NoodelItem('test')
export class TestContentComponent extends NoodelItemContent {
  public readonly title = 'My Node';
}
