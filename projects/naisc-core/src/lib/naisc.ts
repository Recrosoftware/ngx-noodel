import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ComponentFactory,
  ComponentFactoryResolver,
  ElementRef,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  Type,
  ViewChild,
  ViewContainerRef,
  ViewEncapsulation
} from '@angular/core';

import {fromEvent, merge, Observable, Subject, Subscription} from 'rxjs';
import {filter, share, startWith, switchMap, take, takeUntil, tap} from 'rxjs/operators';
import {
  cancelAsyncMicrotask,
  deepCopy,
  runAsyncMicrotask,
  runAsyncTask,
  validateNaiscContent
} from './internal/functions';

import {
  NaiscItemInstanceRef,
  NaiscItemLink,
  NaiscItemLinkRef,
  NaiscLinkEvent,
  NaiscMetadata,
  ViewProjection
} from './internal/models';
import {NAISC_METADATA_ACCESSOR} from './internal/symbols';
import {NaiscItemComponent} from './naisc-item.component';
import {NaiscDump} from './shared/naisc-dump';

import {NaiscItemContent} from './shared/naisc-item-content';
import {NaiscItemDescriptor, NaiscPinDescriptor} from './shared/naisc-item-descriptor';


const DEFAULT_SNAP = true;
const DEFAULT_ANIMATION_DURATION = 300;
const DEFAULT_MIN_ZOOM = .2;
const DEFAULT_MAX_ZOOM = 5;

const DEFAULT_CLOSE_ICON = 'fa fa-fw fa-window-close';

const BACKGROUND_SIZE = 100;

function transformLinear(start: number, end: number, t: number): number {
  return start * (1 - t) + end * t;
}

@Component({
  selector: 'div[naisc]',
  exportAs: 'naisc',
  template: `
    <div #view class="naisc-view">
      <ng-container #itemsContainer></ng-container>

      <svg class="naisc-links">
        <path *ngIf="linkingRef" class="naisc-link naisc-temporary-link" naiscItemLink
              [sourcePin]="linkingRef.pin" [targetPosition]="linkingRef.target"></path>

        <path *ngFor="let link of links" class="naisc-link" naiscItemLink
              [sourcePin]="link.from.pin" [targetPin]="link.to.pin"></path>
      </svg>
    </div>
  `,
  styleUrls: ['./naisc.scss'],
  host: {
    'class': 'naisc-container'
  },
  entryComponents: [NaiscItemComponent],
  encapsulation: ViewEncapsulation.None
})
/* tslint:disable-next-line:component-class-suffix */
export class Naisc implements OnInit, AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('view', {read: ElementRef})
  public viewElementRef: ElementRef;

  @ViewChild('itemsContainer', {read: ViewContainerRef})
  public containerRef: ViewContainerRef;

  @Input() public snap: boolean;
  @Input() public minZoom: number;
  @Input() public maxZoom: number;

  @Input() public templates: Type<NaiscItemContent>[];
  @Input() public animationDuration: number;
  @Input() public animationFunction: (start: number, end: number, t: number) => number;
  @Input() public removeItemIconClass: string;

  public linkingRef: NaiscItemLinkRef & { target: ViewProjection };
  public links: NaiscItemLink[] = [];

  private dragging: boolean;

  private deferredRenderRef: number;
  private animationRequestRef: number;

  private dragSubscription = Subscription.EMPTY;
  private zoomSubscription = Subscription.EMPTY;
  private linkSubscription = Subscription.EMPTY;

  private readonly onDrag: Observable<MouseEvent>;
  private readonly onMove: Observable<MouseEvent>;
  private readonly onZoom: Observable<WheelEvent>;
  private readonly onActionEnd: Observable<Event>;

  private readonly linkEvents: Subject<NaiscLinkEvent>;

  private readonly projectionTarget: ViewProjection;
  private readonly projectionCurrent: ViewProjection;

  private readonly items: NaiscItemInstanceRef[];
  private readonly itemFactory: ComponentFactory<NaiscItemComponent>;

  constructor(private el: ElementRef,
              private zone: NgZone,
              private changeDetector: ChangeDetectorRef,
              private resolver: ComponentFactoryResolver) {
    this.items = [];
    this.itemFactory = this.resolver.resolveComponentFactory(NaiscItemComponent);

    this.projectionTarget = {x: 0, y: 0, z: 1};
    this.projectionCurrent = {x: 0, y: 0, z: 1};

    this.linkEvents = new Subject();

    this.snap = DEFAULT_SNAP;
    this.minZoom = DEFAULT_MIN_ZOOM;
    this.maxZoom = DEFAULT_MAX_ZOOM;
    this.animationDuration = DEFAULT_ANIMATION_DURATION;
    this.animationFunction = transformLinear;
    this.removeItemIconClass = DEFAULT_CLOSE_ICON;

    const dUp = fromEvent<MouseEvent>(document, 'mouseup');
    const dBlur = fromEvent<Event>(document, 'blur');
    const cDown = fromEvent<MouseEvent>(this.el.nativeElement, 'mousedown');

    this.onMove = fromEvent<MouseEvent>(this.el.nativeElement, 'mousemove').pipe(share());
    this.onZoom = fromEvent<WheelEvent>(this.el.nativeElement, 'wheel');
    this.onActionEnd = merge(dBlur, dUp).pipe(
      share(),
      take(1)
    );

    this.onDrag = cDown.pipe(
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
  }

  // region Lifecycle
  public ngOnInit(): void {
    let prevMouseX: number;
    let prevMouseY: number;

    this.dragSubscription = this.onDrag.subscribe(evt => {
      evt.preventDefault();
      evt.stopPropagation();

      const curX = evt.clientX;
      const curY = evt.clientY;

      if (evt.type === 'mousedown') {
        prevMouseX = curX;
        prevMouseY = curY;
        return;
      }

      const diffX = curX - prevMouseX;
      const diffY = curY - prevMouseY;
      prevMouseX = curX;
      prevMouseY = curY;

      this.projectionTarget.x += diffX;
      this.projectionTarget.y += diffY;

      this.render();
    });
    this.zoomSubscription = this.onZoom.subscribe(evt => {
      evt.preventDefault();
      evt.stopPropagation();

      const deltaZoom = -evt.deltaY * .01;
      const {x, y} = this.getMousePositionInContainer(evt);

      this.setZoom(this.projectionTarget.z + deltaZoom, {
        posX: x, posY: y,
        triggerRender: false
      });

      this.render();
    });
  }

  public ngAfterViewInit(): void {
    this.render();
  }

  public ngOnChanges(changes: SimpleChanges): void {
    [
      'animationDuration',
      'animationFunction',
      'removeItemIconClass'
    ].forEach(change => {
      if (change in changes) {
        this.items.forEach(item => item.ref.instance[change] = this[change]);
      }
    });

    if ('templates' in changes) {
      if (this.templates) {
        this.templates.forEach(t => validateNaiscContent(t));
      }

      this.items.forEach(item => {
        item.ref.instance.templates = this.templates;
        item.ref.instance.updateContentTemplate();
      });
    }
  }

  public ngOnDestroy(): void {
    this.dragSubscription.unsubscribe();
    this.zoomSubscription.unsubscribe();
    this.linkSubscription.unsubscribe();
  }

  // endregion

  // region Logic
  public export(): NaiscDump {
    const items = this.items.map(i => i.data);

    return {
      items: deepCopy(items),
      links: items.map(i => i.pins.out.map(pin => {
        const link = this.links.find(l => l.from.pin === pin);
        if (!link) {
          return null;
        }

        try {
          const pinIdx = link.to.item.pins.in.indexOf(link.to.pin);
          const itemIdx = items.indexOf(link.to.item);

          if (pinIdx >= 0 || itemIdx >= 0) {
            return {pinIdx, itemIdx};
          }
        } catch (e) {
        }

        return null;
      }))
    };
  }

  public import(dump: NaiscDump) {
    this.clear();

    dump.items.forEach(d => this.add(d));
    runAsyncTask(() => {
      dump.links.forEach((iL, iI) => iL.forEach((pL, pI) => {
        if (pL != null) {
          this.addLink(dump.items[iI], pI, dump.items[pL.itemIdx], pL.pinIdx);
        }
      }));
    });
  }

  public instantiateFrom(template: Type<NaiscItemContent>, position?: { x: 0, y: 0 }): NaiscItemDescriptor {
    validateNaiscContent(template);

    if (!this.templates || this.templates.indexOf(template) < 0) {
      throw new Error('Template not found in local templates');
    }

    const metadata: NaiscMetadata = template[NAISC_METADATA_ACCESSOR];
    const item = metadata.factory();

    if (position) {
      item.position.x = position.x;
      item.position.y = position.y;
    }

    this.add(item);

    return item;
  }

  public add(item: NaiscItemDescriptor): void {
    if (this.items.some(i => i.data === item)) {
      return;
    }

    const itemRef = this.containerRef.createComponent(this.itemFactory);
    const instance = itemRef.instance;

    instance.item = item;

    instance.removeFn = () => this.remove(item);
    instance.onLink = (a, p) => this.onLink(a, item, p);
    instance.linkEvents = this.linkEvents;
    instance.onMove = this.onMove;
    instance.onActionEnd = this.onActionEnd;
    instance.parentProjection = this.projectionCurrent;

    instance.snap = this.snap;
    instance.templates = this.templates;
    instance.animationDuration = this.animationDuration;
    instance.animationFunction = this.animationFunction;
    instance.removeItemIconClass = this.removeItemIconClass;

    this.items.push({
      ref: itemRef,
      data: item
    });
  }

  public remove(item: NaiscItemDescriptor): void {
    const itemIdx = this.items.findIndex(i => i.data === item);

    if (itemIdx < 0) {
      return;
    }

    item.pins.in.forEach(p => this.removeLink(p));
    item.pins.out.forEach(p => this.removeLink(p));

    const itemRef = this.items[itemIdx].ref;
    itemRef.destroy();

    this.items.splice(itemIdx, 1);
  }

  public clear(): void {
    this.containerRef.clear();
    this.items.length = 0;
    this.links = [];
  }

  public addLink(itemFrom: NaiscItemDescriptor,
                 pinFrom: NaiscPinDescriptor | number,
                 itemTo: NaiscItemDescriptor,
                 pinTo: NaiscPinDescriptor | number): void {
    if (!itemFrom || !itemTo) {
      return;
    }

    if (typeof pinFrom === 'number') {
      pinFrom = itemFrom.pins.out[pinFrom];
    }

    if (typeof pinTo === 'number') {
      pinTo = itemTo.pins.in[pinTo];
    }

    if (!pinFrom || !pinTo) {
      return;
    }

    if (this.items.every(i => i.data !== itemFrom) || this.items.every(i => i.data !== itemFrom)) {
      return;
    }

    const link: NaiscItemLink = {
      from: {
        item: itemFrom,
        pin: pinFrom as NaiscPinDescriptor
      },
      to: {
        item: itemTo,
        pin: pinTo as NaiscPinDescriptor
      }
    };

    this.linkEvents.next({
      actionType: 'add',
      refFrom: link.from,
      refTo: link.to
    });
    this.links = [...this.links, link];
  }

  private onLink(action: 'start' | 'end' | 'remove', item: NaiscItemDescriptor, pin: NaiscPinDescriptor): void {
    switch (action) {
      case 'start':
        this.linkEvents.next({
          actionType: 'start',
          ref: {
            item: item,
            pin: pin
          }
        });

        this.linkingRef = {
          item: item,
          pin: pin,
          target: null
        };

        this.linkSubscription.unsubscribe();
        this.linkSubscription = this.onMove.pipe(
          takeUntil(this.onActionEnd.pipe(tap(() => {
            this.linkingRef = null;
            this.linkEvents.next({actionType: 'end'});
          })))
        ).subscribe(evt => {
          if (!this.linkingRef) {
            this.linkSubscription.unsubscribe();
            return;
          }
          this.linkingRef.target = this.getLocalPosition(this.getMousePositionInContainer(evt));
        });
        break;
      case 'end':
        if (!this.linkingRef) {
          break;
        }

        if (!this.linkingRef.pin.multiple) {
          this.removeLink(this.linkingRef.pin);
        }
        if (!pin.multiple) {
          this.removeLink(pin);
        }

        const iF = this.linkingRef.item;
        const pF = this.linkingRef.pin;

        this.linkSubscription.unsubscribe();

        this.linkingRef = null;
        this.linkEvents.next({actionType: 'end'});

        this.addLink(iF, pF, item, pin);
        break;
      case 'remove':
        this.removeLink(pin);
        break;
    }
  }

  private removeLink(pin: NaiscPinDescriptor): void {
    const toRemove = this.links.filter(l => l.from.pin === pin || l.to.pin === pin);

    if (toRemove.length === 0) {
      return;
    }

    toRemove.forEach(r => {
      this.linkEvents.next({
        actionType: 'remove',
        refFrom: r.from,
        refTo: r.to
      });

      this.links.splice(this.links.indexOf(r), 1);
    });

    this.links.slice();
  }

  // endregion

  // region Rendering
  public requestRender(useAnimations: boolean = true): void {
    this.zone.runOutsideAngular(() => {
      runAsyncMicrotask(() => {
        this.render(useAnimations, true);
        this.items.forEach(i => i.ref.instance.render(useAnimations, true, true));

        this.changeDetector.markForCheck();
      });
    });
  }

  public setZoom(zoom: number,
                 options?: {
                   posX?: number,
                   posY?: number,
                   triggerRender?: boolean,
                   renderWithAnimations?: boolean,
                   deferred?: boolean
                 }): void {
    zoom = Math.max(this.minZoom, Math.min(this.maxZoom, zoom));

    const zoomAspect = zoom / this.projectionTarget.z;

    const x = options && options.posX || 0;
    const y = options && options.posY || 0;

    this.projectionTarget.x = x - (x - this.projectionTarget.x) * zoomAspect;
    this.projectionTarget.y = y - (y - this.projectionTarget.y) * zoomAspect;
    this.projectionTarget.z = zoom;

    const render = !options || options.triggerRender == null || !!options.triggerRender;
    const renderAnimations = !options || options.renderWithAnimations == null || !!options.renderWithAnimations;
    const deferredRendering = !options || options.deferred == null || !!options.deferred;

    if (render) {
      if (deferredRendering) {
        cancelAsyncMicrotask(this.deferredRenderRef);
        this.deferredRenderRef = runAsyncMicrotask(() => {
          this.render(renderAnimations);
        });
      } else {
        this.render(renderAnimations);
      }
    }
  }

  public setCenter(center: { x: number, y: number },
                   options?: { triggerRender?: boolean, renderWithAnimations?: boolean, deferred?: boolean }): void {
    this.projectionTarget.x = -center.x * this.projectionTarget.z;
    this.projectionTarget.y = -center.y * this.projectionTarget.z;

    const render = !options || options.triggerRender == null || !!options.triggerRender;
    const renderAnimations = !options || options.renderWithAnimations == null || !!options.renderWithAnimations;
    const deferredRendering = !options || options.deferred == null || !!options.deferred;

    if (render) {
      if (deferredRendering) {
        cancelAsyncMicrotask(this.deferredRenderRef);
        this.deferredRenderRef = runAsyncMicrotask(() => {
          this.render(renderAnimations);
        });
      } else {
        this.render(renderAnimations);
      }
    }
  }

  public fitView(extent?: { top: number, right: number, bottom: number, left: number }, useAnimations?: boolean): void {
    let eWidth: number;
    let eHeight: number;
    let eCenterX: number;
    let eCenterY: number;

    let noExtent = false;

    if (!extent) {
      let top = Number.POSITIVE_INFINITY;
      let right = Number.NEGATIVE_INFINITY;
      let bottom = Number.NEGATIVE_INFINITY;
      let left = Number.POSITIVE_INFINITY;

      if (this.items.length > 0) {
        this.items.forEach(item => {
          const e = item.ref.instance.getItemExtent();

          if (top > e.top) {
            top = e.top;
          }
          if (right < e.right) {
            right = e.right;
          }
          if (bottom < e.bottom) {
            bottom = e.bottom;
          }
          if (left > e.left) {
            left = e.left;
          }
        });

        eWidth = Math.abs(right - left);
        eHeight = Math.abs(bottom - top);

        eCenterX = (right + left) / 2;
        eCenterY = (bottom + top) / 2;
      } else {
        noExtent = true;
      }
    } else {
      eWidth = Math.abs(extent.right - extent.left);
      eHeight = Math.abs(extent.bottom - extent.top);

      eCenterX = (extent.right + extent.left) / 2;
      eCenterY = (extent.bottom + extent.top) / 2;
    }

    if (noExtent) {
      this.projectionTarget.x = 0;
      this.projectionTarget.y = 0;
      this.projectionTarget.z = 1;
    } else {
      const {width, height} = this.getContainerSize();

      const wRatio = width / eWidth;
      const hRatio = height / eHeight;

      const ratio = Math.min(wRatio, hRatio) * .95;
      const zoom = Math.min(this.maxZoom, Math.max(this.minZoom, ratio));

      this.projectionTarget.x = -eCenterX * zoom;
      this.projectionTarget.y = -eCenterY * zoom;
      this.projectionTarget.z = zoom;
    }

    this.requestRender(useAnimations);
  }

  private render(useAnimation: boolean = true, thisZone: boolean = false): void {
    if (!this.viewElementRef) {
      return;
    }

    const _render = () => {
      useAnimation = useAnimation && !this.dragging && typeof window.requestAnimationFrame === 'function';

      const c = this.el.nativeElement as HTMLDivElement;
      const v = this.viewElementRef.nativeElement as HTMLDivElement;

      const setStyle = (x: number, y: number, zoom: number) => {
        const bgW = BACKGROUND_SIZE * zoom;
        const bgHW = bgW / 2;

        c.style.backgroundSize = `${bgW}px`;
        c.style.backgroundPositionX = `calc(50% + ${(x + bgHW) % bgW}px)`;
        c.style.backgroundPositionY = `calc(50% + ${(y + bgHW) % bgW}px)`;

        v.style.transform = `translate(${x}px, ${y}px) scale(${zoom})`;

        this.projectionCurrent.x = x;
        this.projectionCurrent.y = y;
        this.projectionCurrent.z = zoom;
      };

      const pt = this.projectionTarget;

      if (!useAnimation) {
        setStyle(pt.x, pt.y, pt.z);
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
            setStyle(pt.x, pt.y, pt.z);
            return;
          }

          const t = span / this.animationDuration;

          setStyle(af(pc.x, pt.x, t), af(pc.y, pt.y, t), af(pc.z, pt.z, t));
          this.animationRequestRef = requestAnimationFrame(animate);
        };

        cancelAnimationFrame(this.animationRequestRef);
        this.animationRequestRef = requestAnimationFrame(animate);
      }
    };

    if (thisZone) {
      _render();
    } else {
      this.zone.runOutsideAngular(_render);
    }
  }

  private getContainerSize(): { width: number, height: number } {
    const c = this.el.nativeElement as HTMLDivElement;

    if (typeof c.getBoundingClientRect !== 'function') {
      return {width: 600, height: 400};
    }

    const {width, height} = c.getBoundingClientRect();

    return {
      width,
      height
    };
  }

  private getMousePositionInContainer({pageX, pageY}: MouseEvent) {
    const c = this.el.nativeElement as HTMLDivElement;

    if (typeof c.getBoundingClientRect !== 'function') {
      return {x: 0, y: 0};
    }

    const rect = c.getBoundingClientRect();
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    const x = rect.left + scrollLeft;
    const y = rect.top + scrollTop;

    return {
      x: pageX - (x + rect.width / 2),
      y: pageY - (y + rect.height / 2)
    };
  }

  private getLocalPosition({x, y}: { x: number, y: number }) {
    return {
      x: (x - this.projectionTarget.x) / this.projectionTarget.z,
      y: (y - this.projectionTarget.y) / this.projectionTarget.z
    };
  }

  // endregion
}
