import {
  AfterViewInit,
  Directive,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnDestroy,
  OnInit,
  Output
} from '@angular/core';
import {Observable, Subscription} from 'rxjs';

import {NaiscLinkEvent, ViewProjection} from './internal/models';
import {NAISC_PIN_POSITION} from './internal/symbols';

import {NaiscItemDescriptor, NaiscPinDescriptor} from './shared/naisc-item-descriptor';


@Directive({
  selector: 'div[naiscItemPin]',
  host: {
    'class': 'naisc-item-pin',
    '[class.multi]': 'pin.multiple',
    '[class.active]': 'active',
    '[class.invalid]': 'invalid',
    '[class.highlight]': 'highlight'
  }
})
export class NaiscItemPinDirective implements OnInit, AfterViewInit, OnDestroy {
  /* tslint:disable-next-line:no-input-rename */
  @Input('naiscItemPin') public pin: NaiscPinDescriptor & {
    [NAISC_PIN_POSITION]?: ViewProjection;
  };

  @Input() public item: NaiscItemDescriptor;
  @Input() public type: 'in' | 'out';

  @Input() public linkEvents: Observable<NaiscLinkEvent>;

  @Output() public linkEnd: EventEmitter<MouseEvent>;
  @Output() public linkStart: EventEmitter<MouseEvent>;
  @Output() public removeLinks: EventEmitter<MouseEvent>;
  @Output() public calculatePosition: EventEmitter<ViewProjection>;

  public active: boolean;
  public invalid: boolean;
  public highlight: boolean;

  private eventSubscription = Subscription.EMPTY;

  constructor(private el: ElementRef) {
    this.resetState();

    this.linkEnd = new EventEmitter();
    this.linkStart = new EventEmitter();
    this.removeLinks = new EventEmitter();
    this.calculatePosition = new EventEmitter();
  }

  public ngOnInit(): void {
    this.eventSubscription = this.linkEvents.subscribe(evt => {
      switch (evt.actionType) {
        case 'start':
          this.resetState();
          if (evt.ref.pin === this.pin) {
            this.highlight = true;
          } else if (evt.ref.item === this.item || this.type === 'out') {
            this.active = false;
          } else if (evt.ref.pin.type !== this.pin.type) {
            this.invalid = true;
          }
          break;
        case 'end':
          this.resetState();
          break;
      }
    });
  }

  public ngAfterViewInit(): void {
    this.calculatePosition.emit(this.getPinPosition());
  }

  public ngOnDestroy(): void {
    this.eventSubscription.unsubscribe();
  }

  @HostListener('mousedown', ['$event'])
  public onMouseDown(evt: MouseEvent): void {
    evt.preventDefault();
    evt.stopPropagation();

    if (!this.active || this.invalid || this.type === 'in') {
      return;
    }

    this.linkStart.emit(evt);
  }

  @HostListener('mouseup', ['$event'])
  public onMouseUp(evt: MouseEvent): void {
    if (!this.active || this.invalid || this.type === 'out') {
      return;
    }

    this.linkEnd.emit(evt);
  }

  @HostListener('click', ['$event'])
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
