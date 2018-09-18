import {Component, OnDestroy} from '@angular/core';
import {FormControl} from '@angular/forms';
import {NaiscItem, NaiscItemContent} from '@naisc/core';
import {Subscription} from 'rxjs';


@Component({
  template: `
    Hello World<br>
    <select [formControl]="ctrl" style="width: 100%">
      <option value="1">1</option>
      <option value="2">2</option>
      <option value="3">3</option>
      <option value="4">4</option>
    </select>
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
export class TestContentComponent extends NaiscItemContent implements OnDestroy {
  public ctrl: FormControl;

  private readonly title = 'My Node';
  private readonly ctrlSub: Subscription;

  constructor() {
    super();

    this.ctrl = new FormControl();
    this.ctrlSub = this.ctrl.valueChanges.subscribe(v => {
      this.item.state['value'] = v;
      this.registerHistory();
    });
  }

  public ngOnDestroy(): void {
    this.ctrlSub.unsubscribe();
  }

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
