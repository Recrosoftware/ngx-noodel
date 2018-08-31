import {Component} from '@angular/core';
import {NaiscItem, NaiscItemContent} from 'ngx-naisc';


@Component({
  template: `
    Hello World
  `
})
@NaiscItem('test')
export class TestContentComponent extends NaiscItemContent {
  public readonly title = 'My Node';
}
