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

import {METADATA_ACCESSOR, NoodelMetadata, validateNoodelContent, ViewProjection} from './internal';

import {NoodelItemComponent} from './noodel-item.component';

import {NoodelItemContent, NoodelItemDescriptor} from './shared';


const DEFAULT_ANIMATION_DURATION = 300;
const DEFAULT_MIN_ZOOM = .1;
const DEFAULT_MAX_ZOOM = 10;

const BACKGROUND_SIZE = 100;

function transformLinear(start: number, end: number, t: number): number {
  return start * (1 - t) + end * t;
}

@Component({
  selector: 'div[ngxNoodel]',
  exportAs: 'ngxNoodel',
  template: `
    <div #view class="noodel-view">
      <ng-container #itemsContainer></ng-container>

      <svg class="noodel-connections">
        <path class="noodel-connection"></path>
      </svg>
    </div>
  `,
  styleUrls: ['./noodel.component.scss'],
  entryComponents: [NoodelItemComponent],
  encapsulation: ViewEncapsulation.None
})
export class NoodelComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('view', {read: ElementRef})
  public viewElementRef: ElementRef;

  @ViewChild('itemsContainer', {read: ViewContainerRef})
  public containerRef: ViewContainerRef;

  @Input() public minZoom: number;
  @Input() public maxZoom: number;

  @Input() public templates: Type<NoodelItemContent>[];
  @Input() public animationDuration: number;
  @Input() public animationFunction: (start: number, end: number, t: number) => number;

  private dragging: boolean;
  private animationRequestRef: number;

  private dragSubscription = Subscription.EMPTY;
  private zoomSubscription = Subscription.EMPTY;

  private readonly onDrag: Observable<MouseEvent>;
  private readonly onZoom: Observable<WheelEvent>;

  private readonly projectionTarget: ViewProjection;
  private readonly projectionCurrent: ViewProjection;

  private readonly items: {
    ref: ComponentRef<NoodelItemComponent>,
    data: NoodelItemDescriptor
  }[];
  private readonly itemFactory: ComponentFactory<NoodelItemComponent>;

  constructor(private el: ElementRef,
              private resolver: ComponentFactoryResolver) {
    this.items = [];
    this.itemFactory = this.resolver.resolveComponentFactory(NoodelItemComponent);

    this.projectionTarget = {x: 0, y: 0, z: 1};
    this.projectionCurrent = {x: 0, y: 0, z: 1};

    this.animationFunction = transformLinear;
    this.minZoom = DEFAULT_MIN_ZOOM;
    this.maxZoom = DEFAULT_MAX_ZOOM;
    this.animationDuration = DEFAULT_ANIMATION_DURATION;

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
      const {x, y} = this.getContainerCoordinates(evt);

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
    ['animationDuration', 'animationFunction'].forEach(change => {
      if (change in changes) {
        this.items.forEach(item => item.ref.instance[change] = this[change]);
      }
    });

    if ('templates' in changes) {
      if (this.templates) {
        this.templates.forEach(t => validateNoodelContent(t));
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

  public instantiateFrom(template: Type<any>): void {
    validateNoodelContent(template);

    if (!this.templates || this.templates.indexOf(template) < 0) {
      throw new Error('Template not found in local templates');
    }

    const metadata: NoodelMetadata = template[METADATA_ACCESSOR];

    this.add(metadata.factory());
  }

  public add(item: NoodelItemDescriptor): void {
    if (this.items.some(i => i.data === item)) {
      return;
    }

    const itemRef = this.containerRef.createComponent(this.itemFactory);
    const instance = itemRef.instance;

    instance.item = item;
    instance.parentProjection = this.projectionCurrent;

    instance.templates = this.templates;
    instance.animationDuration = this.animationDuration;
    instance.animationFunction = this.animationFunction;

    this.items.push({
      ref: itemRef,
      data: item
    });
  }

  public remove(item: NoodelItemDescriptor): void {
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

  private getContainerCoordinates({pageX, pageY}: MouseEvent) {
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
