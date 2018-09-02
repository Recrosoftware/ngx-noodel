import {
  AfterViewInit,
  Component,
  ComponentFactoryResolver,
  ComponentRef,
  ElementRef,
  Input,
  OnDestroy,
  QueryList,
  Type,
  ViewChild,
  ViewChildren,
  ViewContainerRef,
  ViewEncapsulation
} from '@angular/core';

import {fromEvent, Observable, Subscription} from 'rxjs';
import {filter, share, startWith, switchMap, takeUntil, tap} from 'rxjs/operators';

import {RsAsyncInput} from './common';
import {NaiscLinkEvent} from './internal/naisc-link-event';
import {NaiscType} from './internal/naisc-type';
import {NAISC_METADATA_ACCESSOR, NAISC_PIN_POSITION} from './internal/symbols';
import {ViewProjection} from './internal/view-projection';

import {NaiscDefaultItemComponent} from './naisc-default-item.component';
import {NaiscItemPinDirective} from './naisc-item-pin.directive';
import {NaiscItemContent} from './shared/naisc-item-content';
import {NaiscItemDescriptor, NaiscPinDescriptor} from './shared/naisc-item-descriptor';


@Component({
  selector: 'div[naiscItem]',
  template: `
    <div class="naisc-item-track-bar" #titleBar>
      {{getTitle() | rsAsync}}
      <i *ngIf="!item.permanent" (click)="onRemoveClick($event)"
         class="naisc-item-close-btn {{removeItemIconClass}}"></i>
    </div>

    <div class="naisc-item-pins">
      <ul class="naisc-item-pins-in">
        <li *ngFor="let pin of item.pins.in; let idx = index">
          <span>{{getInputPinName(idx) | rsAsync}}</span>
          <div [naiscItemPin]="pin" [item]="item" type="in"
               [linkEvents]="linkEvents"
               (linkEnd)="onLinkInternal('end', pin)"
               (linkStart)="onLinkInternal('start', pin)"
               (removeLinks)="onLinkInternal('remove', pin)"></div>
        </li>
      </ul>
      <ul class="naisc-item-pins-out">
        <li *ngFor="let pin of item.pins.out; let idx = index">
          <span>{{getOutputPinName(idx) | rsAsync}}</span>
          <div [naiscItemPin]="pin" [item]="item" type="out"
               [linkEvents]="linkEvents"
               (linkEnd)="onLinkInternal('end', pin)"
               (linkStart)="onLinkInternal('start', pin)"
               (removeLinks)="onLinkInternal('remove', pin)"></div>
        </li>
      </ul>
    </div>

    <div class="naisc-item-content">
      <ng-container #itemContentContainer></ng-container>
    </div>
  `,
  host: {
    'class': 'naisc-item',
    '(mousedown)': 'onMouseDown($event)'
  },
  entryComponents: [
    NaiscDefaultItemComponent
  ],
  encapsulation: ViewEncapsulation.None
})
export class NaiscItemComponent implements AfterViewInit, OnDestroy {
  @ViewChild('titleBar', {read: ElementRef}) public titleBarRef: ElementRef;
  @ViewChild('itemContentContainer', {read: ViewContainerRef}) public itemContentContainer: ViewContainerRef;

  @ViewChildren(NaiscItemPinDirective) public pinRefs: QueryList<NaiscItemPinDirective>;

  @Input() public item: NaiscItemDescriptor;

  @Input() public removeFn: () => void;
  @Input() public onLink: (a: 'start' | 'end' | 'remove', p: NaiscPinDescriptor) => void;
  @Input() public linkEvents: Observable<NaiscLinkEvent>;
  @Input() public onMove: Observable<MouseEvent>;
  @Input() public onActionEnd: Observable<Event>;
  @Input() public parentProjection: ViewProjection;

  @Input() public snap: boolean;
  @Input() public templates: NaiscType[];
  @Input() public animationDuration: number;
  @Input() public animationFunction: (start: number, end: number, t: number) => number;
  @Input() public removeItemIconClass: string;

  public readonly projectionCurrent: ViewProjection;
  private animationRequestRef: number;

  private dragging: boolean;

  private contentRef: ComponentRef<NaiscItemContent>;
  private contentRefType: NaiscType;

  private dragSubscription = Subscription.EMPTY;

  constructor(private el: ElementRef,
              private resolver: ComponentFactoryResolver) {
    this.dragging = false;
    this.projectionCurrent = {x: 0, y: 0};
  }

  public ngAfterViewInit(): void {
    this.render();
    this.listenDragEvents();

    setTimeout(() => this.updateContentTemplate());
  }

  public ngOnDestroy(): void {
    this.dragSubscription.unsubscribe();
  }

  public onMouseDown(evt: Event): void {
    evt.preventDefault();
    evt.stopPropagation();
  }

  public getTitle(): RsAsyncInput<string> {
    return this.contentRef ? this.contentRef.instance.getTitle() : '';
  }

  public getInputPinName(index: number): RsAsyncInput<string> {
    return this.contentRef ? this.contentRef.instance.getInputPinName(index) : '';
  }

  public getOutputPinName(index: number): RsAsyncInput<string> {
    return this.contentRef ? this.contentRef.instance.getOutputPinName(index) : '';
  }

  public onRemoveClick(evt: Event): void {
    evt.preventDefault();
    evt.stopPropagation();

    this.removeFn();
  }

  public updateContentTemplate(): void {
    if (!this.itemContentContainer) {
      return;
    }

    const templateType: Type<NaiscItemContent> = (
      this.templates ?
        this.templates
          .find(t => t[NAISC_METADATA_ACCESSOR].type === this.item.type) as any :
        null
    ) || NaiscDefaultItemComponent;

    if (templateType === this.contentRefType) {
      return;
    }

    if (this.contentRef) {
      this.contentRef.destroy();
    }

    const factory = this.resolver.resolveComponentFactory(templateType);
    this.contentRef = this.itemContentContainer.createComponent(factory);
    this.contentRefType = templateType;

    this.contentRef.instance.item = this.item;
  }

  public onLinkInternal(a: 'start' | 'end' | 'remove', p: NaiscPinDescriptor): void {
    this.render(false, true);
    this.onLink(a, p);
  }

  public render(useAnimations: boolean = false, forced: boolean = false): void {
    if (!forced && this.item.position.x === this.projectionCurrent.x && this.item.position.y === this.projectionCurrent.y) {
      return;
    }

    useAnimations = useAnimations && typeof window.requestAnimationFrame === 'function';

    this.recalculatePinsPosition();

    const c = this.el.nativeElement as HTMLDivElement;

    const setStyle = (x: number, y: number) => {
      c.style.transform = `translate(${x}px, ${y}px)`;

      this.projectionCurrent.x = x;
      this.projectionCurrent.y = y;
    };

    const pt = this.item.position;

    if (!useAnimations) {
      setStyle(pt.x, pt.y);
    } else {
      const pc = this.projectionCurrent;
      const af = this.animationFunction;

      let startTs: number = null;
      const animate = (timestamp) => {
        if (startTs == null) {
          startTs = timestamp;
        }

        const span = timestamp - startTs;

        if (span >= this.animationDuration) {
          setStyle(pt.x, pt.y);
          return;
        }

        const t = span / this.animationDuration;

        setStyle(af(pc.x, pt.x, t), af(pc.y, pt.y, t));
        this.animationRequestRef = requestAnimationFrame(animate);
      };

      cancelAnimationFrame(this.animationRequestRef);
      this.animationRequestRef = requestAnimationFrame(animate);
    }
  }

  private listenDragEvents(): void {
    const cDown = fromEvent<MouseEvent>(this.titleBarRef.nativeElement, 'mousedown');
    const cDrag = cDown.pipe(
      filter(down => down.button === 0), // Left Click
      switchMap(down => this.onMove.pipe(
        tap(() => this.dragging = true),
        startWith(down),
        takeUntil(
          this.onActionEnd.pipe(
            tap(() => this.dragging = false)
          )
        )
      )),
      share()
    );


    let evtPos: ViewProjection;
    let itemPos: ViewProjection;

    this.dragSubscription = cDrag.subscribe(evt => {
      evt.preventDefault();
      evt.stopPropagation();

      const curX = evt.clientX;
      const curY = evt.clientY;

      if (evt.type === 'mousedown') {
        evtPos = {x: curX, y: curY};
        itemPos = {
          x: this.item.position.x,
          y: this.item.position.y
        };
        return;
      }

      const diffX = (curX - evtPos.x) / this.parentProjection.z;
      const diffY = (curY - evtPos.y) / this.parentProjection.z;

      let x = itemPos.x + diffX;
      let y = itemPos.y + diffY;

      if (this.snap) {
        x = Math.round(x / 10) * 10;
        y = Math.round(y / 10) * 10;
      }

      this.item.position.x = x;
      this.item.position.y = y;

      this.render();
    });
  }

  private recalculatePinsPosition(): void {
    if (!this.el || typeof this.el.nativeElement.getBoundingClientRect !== 'function') {
      return;
    }

    const localPosition = this.getItemPosition();

    this.pinRefs.forEach(pinRef => {
      const pin = pinRef.pin;
      const pinPosition = pinRef.getPinPosition();

      const diffX = (pinPosition.x - localPosition.x) / this.parentProjection.z;
      const diffY = (pinPosition.y - localPosition.y) / this.parentProjection.z;

      pin[NAISC_PIN_POSITION] = {
        x: this.item.position.x + diffX,
        y: this.item.position.y + diffY
      };
    });
  }

  private getItemPosition(): ViewProjection {
    const c = this.el.nativeElement as HTMLDivElement;

    if (typeof c.getBoundingClientRect !== 'function') {
      return {x: 0, y: 0};
    }

    const rect = c.getBoundingClientRect();
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    const x = rect.left + scrollLeft;
    const y = rect.top + scrollTop;

    return {x, y};
  }
}
