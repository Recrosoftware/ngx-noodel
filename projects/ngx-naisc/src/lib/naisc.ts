import {
  AfterViewInit,
  Component,
  ComponentFactory,
  ComponentFactoryResolver,
  ComponentRef,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  Type,
  ViewChild,
  ViewContainerRef,
  ViewEncapsulation
} from '@angular/core';

import {fromEvent, merge, Observable, Subscription} from 'rxjs';
import {filter, share, startWith, switchMap, take, takeUntil, tap} from 'rxjs/operators';

import {NaiscMetadata} from './internal/naisc-metadata';
import {NAISC_METADATA_ACCESSOR} from './internal/symbols';
import {validateNaiscContent} from './internal/validators';
import {ViewProjection} from './internal/view-projection';
import {NaiscItemComponent} from './naisc-item.component';

import {NaiscItemContent} from './shared/naisc-item-content';
import {NaiscItemDescriptor} from './shared/naisc-item-descriptor';


const DEFAULT_ANIMATION_DURATION = 300;
const DEFAULT_MIN_ZOOM = .1;
const DEFAULT_MAX_ZOOM = 10;

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

      <svg class="naisc-connections">
        <path class="naisc-connection"></path>
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

  @Input() public minZoom: number;
  @Input() public maxZoom: number;

  @Input() public templates: Type<NaiscItemContent>[];
  @Input() public animationDuration: number;
  @Input() public animationFunction: (start: number, end: number, t: number) => number;
  @Input() public removeItemIconClass: string;

  private dragging: boolean;
  private animationRequestRef: number;

  private dragSubscription = Subscription.EMPTY;
  private zoomSubscription = Subscription.EMPTY;

  private readonly onDrag: Observable<MouseEvent>;
  private readonly onZoom: Observable<WheelEvent>;

  private readonly projectionTarget: ViewProjection;
  private readonly projectionCurrent: ViewProjection;

  private readonly items: {
    ref: ComponentRef<NaiscItemComponent>,
    data: NaiscItemDescriptor
  }[];
  private readonly itemFactory: ComponentFactory<NaiscItemComponent>;

  constructor(private el: ElementRef,
              private resolver: ComponentFactoryResolver) {
    this.items = [];
    this.itemFactory = this.resolver.resolveComponentFactory(NaiscItemComponent);

    this.projectionTarget = {x: 0, y: 0, z: 1};
    this.projectionCurrent = {x: 0, y: 0, z: 1};

    this.minZoom = DEFAULT_MIN_ZOOM;
    this.maxZoom = DEFAULT_MAX_ZOOM;
    this.animationDuration = DEFAULT_ANIMATION_DURATION;
    this.animationFunction = transformLinear;
    this.removeItemIconClass = DEFAULT_CLOSE_ICON;

    const dBlur = fromEvent<Event>(document, 'blur');
    const dUp = fromEvent<MouseEvent>(document, 'mouseup');

    const cMove = fromEvent<MouseEvent>(this.el.nativeElement, 'mousemove');
    const cDown = fromEvent<MouseEvent>(this.el.nativeElement, 'mousedown');
    const cDrag = cDown.pipe(
      filter(down => down.button === 0), // Left Click
      switchMap(down => cMove.pipe(
        tap(() => this.dragging = true),
        startWith(down),
        takeUntil(
          merge(dUp, dBlur).pipe(
            take(1),
            tap(() => this.dragging = false)
          )
        )
      )),
      share()
    );
    const cZoom = fromEvent<WheelEvent>(this.el.nativeElement, 'wheel');

    this.onDrag = cDrag;
    this.onZoom = cZoom;
  }

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

      const newZoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.projectionTarget.z + deltaZoom));
      const zoomAspect = newZoom / this.projectionTarget.z;

      this.projectionTarget.x = x - (x - this.projectionTarget.x) * zoomAspect;
      this.projectionTarget.y = y - (y - this.projectionTarget.y) * zoomAspect;
      this.projectionTarget.z = newZoom;

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
    instance.parentProjection = this.projectionCurrent;

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

    const itemRef = this.items[itemIdx].ref;
    itemRef.destroy();

    this.items.splice(itemIdx, 1);
  }

  public clear(): void {
    this.containerRef.clear();
    this.items.length = 0;
  }

  public requestRender(useAnimations: boolean = true): void {
    setTimeout(() => {
      this.render(useAnimations);
      this.items.forEach(i => i.ref.instance.render(useAnimations));
    });
  }

  private render(useAnimation: boolean = true): void {
    if (!this.viewElementRef) {
      return;
    }

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
}
