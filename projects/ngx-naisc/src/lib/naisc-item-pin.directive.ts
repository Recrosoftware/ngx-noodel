import {Directive, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {Observable, Subscription} from 'rxjs';

import {NaiscLinkEvent} from './internal/naisc-link-event';
import {NAISC_PIN_POSITION} from './internal/symbols';
import {ViewProjection} from './internal/view-projection';

import {NaiscItemDescriptor, NaiscPinDescriptor} from './shared/naisc-item-descriptor';


@Directive({
  selector: 'div[naiscItemPin]',
  host: {
    'class': 'naisc-item-pin',
    '[class.multi]': 'pin.multiple',
    '[class.active]': 'active',
    '[class.invalid]': 'invalid',
    '[class.highlight]': 'highlight',
    '(click)': 'onClick($event)',
    '(mouseup)': 'onMouseUp($event)',
    '(mousedown)': 'onMouseDown($event)'
  }
})
export class NaiscItemPinDirective implements OnInit, OnDestroy {
  /* tslint:disable-next-line:no-input-rename */
  @Input('naiscItemPin') public pin: NaiscPinDescriptor & {
    [NAISC_PIN_POSITION]?: ViewProjection;
  };

  @Input() public item: NaiscItemDescriptor;
  @Input() public type: 'in' | 'out';

  @Input() public linkEvents: Observable<NaiscLinkEvent>;

  @Output() public removeLinks: EventEmitter<MouseEvent>;
  @Output() public linkStart: EventEmitter<MouseEvent>;
  @Output() public linkEnd: EventEmitter<MouseEvent>;

  public active: boolean;
  public invalid: boolean;
  public highlight: boolean;

  private eventSubscription = Subscription.EMPTY;

  constructor(private el: ElementRef) {
    this.resetState();

    this.removeLinks = new EventEmitter();
    this.linkStart = new EventEmitter();
    this.linkEnd = new EventEmitter();
  }

  public ngOnInit(): void {
    this.eventSubscription = this.linkEvents.subscribe(evt => {
      this.resetState();

      switch (evt.actionType) {
        case 'start':
          if (evt.ref.pin === this.pin) {
            this.highlight = true;
          } else if (evt.ref.item === this.item || this.type === 'out') {
            this.active = false;
          } else if (evt.ref.pin.type !== this.pin.type) {
            this.invalid = true;
          }
          break;
      }
    });
  }

  public ngOnDestroy(): void {
    this.eventSubscription.unsubscribe();
  }

  public onMouseDown(evt: MouseEvent): void {
    evt.preventDefault();
    evt.stopPropagation();

    if (!this.active || this.invalid || this.type === 'in') {
      return;
    }

    this.linkStart.emit(evt);
  }

  public onMouseUp(evt: MouseEvent): void {
    if (!this.active || this.invalid || this.type === 'out') {
      return;
    }

    this.linkEnd.emit(evt);
  }

  public onClick(evt: MouseEvent): void {
    if (!this.active) {
      return;
    }

    this.removeLinks.emit(evt);
  }

  public getPinPosition(): ViewProjection {
    const c = this.el.nativeElement as HTMLDivElement;

    if (typeof c.getBoundingClientRect !== 'function') {
      return {x: 0, y: 0};
    }

    const rect = c.getBoundingClientRect();
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    const x = rect.left + scrollLeft + rect.width / 2;
    const y = rect.top + scrollTop + rect.height / 2;

    return {x, y};
  }

  private resetState(): void {
    this.active = true;
    this.invalid = false;
    this.highlight = false;
  }
}
