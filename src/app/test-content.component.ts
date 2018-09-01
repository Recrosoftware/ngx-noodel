import {Component} from '@angular/core';
import {NaiscItem, NaiscItemContent} from '@naisc/core';


@Component({
  template: `
    Hello World
  `
})
@NaiscItem('test', {
  inputPins: [
    {type: 'a', multiple: true}
  ],
  outputPins: [
    {type: 'a', multiple: false}
  ]
})
export class TestContentComponent extends NaiscItemContent {
  private readonly title = 'My Node';

  public getTitle(): string {
    return this.title;
  }

  public getInputPinName(idx: number): string {
    return 'Generic input';
  }

  public getOutputPinName(idx: number): string {
    return 'Generic output';
  }
}
