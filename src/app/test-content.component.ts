import {Component} from '@angular/core';
import {NaiscItem, NaiscItemContent} from '@naisc/core';


@Component({
  template: `
    Hello World
  `
})
@NaiscItem('test')
export class TestContentComponent extends NaiscItemContent {
  private readonly title = 'My Node';

  public getTitle(): string {
    return this.title;
  }

  public getPinName(type: 'in' | 'out', idx: number): string {
    return '';
  }
}
