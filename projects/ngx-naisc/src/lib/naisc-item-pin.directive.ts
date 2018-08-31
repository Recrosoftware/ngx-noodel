import {AfterViewInit, Directive, ElementRef, Input} from '@angular/core';
import {ViewProjection} from './internal';
import {NaiscItemDescriptor, NaiscPinDescriptor} from './shared';


@Directive({
  selector: 'div[ngxNaiscItemPin]',
  host: {
    'class': 'naisc-item-pin',
    '[class.multi]': 'pin.multiple',
    '[class.active]': 'active',
    '[class.invalid]': 'invalid',
    '(mousedown)': 'onMouseDown($event)',
    '(mouseup)': 'onMouseUp($event)',
    '(click)': 'onClick($event)'
  }
})
export class NaiscItemPinDirective implements AfterViewInit {
  /* tslint:disable-next-line:no-input-rename */
  @Input('ngxNaiscItemPin') public pin: NaiscPinDescriptor;
  @Input() public item: NaiscItemDescriptor;
  @Input() public type: 'in' | 'out';

  @Input() public parentContainer: ElementRef;
  @Input() public parentProjection: ViewProjection;
  @Input() public globalProjection: ViewProjection;

  public active: boolean;
  public invalid: boolean;

  constructor(private el: ElementRef) {
    this.active = true;
    this.invalid = false;
  }

  public ngAfterViewInit(): void {
  }

  public onMouseDown(evt: MouseEvent): void {
    evt.preventDefault();
    evt.stopPropagation();
  }

  public onMouseUp(evt: MouseEvent): void {
    evt.preventDefault();
    evt.stopPropagation();
  }

  public onClick(evt: MouseEvent): void {
    evt.preventDefault();
    evt.stopPropagation();
  }
}
