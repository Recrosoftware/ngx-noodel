import {
  AfterViewInit,
  Component,
  ComponentFactoryResolver,
  ComponentRef,
  ElementRef,
  Input,
  Type,
  ViewChild,
  ViewContainerRef,
  ViewEncapsulation
} from '@angular/core';

import {RsAsyncInput} from './common';
import {METADATA_ACCESSOR, ViewProjection} from './internal';

import {NaiscDefaultItemComponent} from './naisc-default-item.component';

import {NaiscItemContent, NaiscItemDescriptor} from './shared';


@Component({
  selector: 'div[ngxNaiscItem]',
  template: `
    <div class="naisc-item-track-bar">
      {{getTitle() | rsAsync}}
      <i *ngIf="!item.permanent" (click)="onRemoveClick($event)"
         class="naisc-item-close-btn {{removeItemIconClass}}"></i>
    </div>

    <div class="naisc-item-pins">
      <ul class="naisc-item-pins-in">
        <li *ngFor="let pin of item.pins.in; let idx = index">
          <span>{{getPinName('in', idx) | rsAsync}}</span>
          <div [ngxNaiscItemPin]="pin" [item]="item" type="in"
               [parentContainer]="el"
               [parentProjection]="projectionCurrent"
               [globalProjection]="parentProjection"></div>
        </li>
      </ul>
      <ul class="naisc-item-pins-out">
        <li *ngFor="let pin of item.pins.out; let idx = index">
          <span>{{getPinName('out', idx) | rsAsync}}</span>
          <div [ngxNaiscItemPin]="pin" [item]="item" type="out"
               [parentContainer]="el"
               [parentProjection]="projectionCurrent"
               [globalProjection]="parentProjection"></div>
        </li>
      </ul>
    </div>

    <div class="naisc-item-content">
      <ng-container #itemContentContainer></ng-container>
    </div>
  `,
  host: {
    'class': 'naisc-item'
  },
  entryComponents: [
    NaiscDefaultItemComponent
  ],
  encapsulation: ViewEncapsulation.None
})
export class NaiscItemComponent implements AfterViewInit {
  @ViewChild('itemContentContainer', {read: ViewContainerRef}) public itemContentContainer: ViewContainerRef;

  @Input() public item: NaiscItemDescriptor;

  @Input() public removeFn: () => void;
  @Input() public parentProjection: ViewProjection;

  @Input() public templates: Type<NaiscItemContent>[];
  @Input() public animationDuration: number;
  @Input() public animationFunction: (start: number, end: number, t: number) => number;
  @Input() public removeItemIconClass: string;

  public readonly projectionCurrent: ViewProjection;
  private animationRequestRef: number;

  private contentRef: ComponentRef<NaiscItemContent>;
  private contentRefType: Type<NaiscItemContent>;

  constructor(public el: ElementRef,
              private resolver: ComponentFactoryResolver) {
    this.projectionCurrent = {x: 0, y: 0};
  }

  public ngAfterViewInit(): void {
    this.render();

    setTimeout(() => this.updateContentTemplate());
  }

  public getTitle(): RsAsyncInput<string> {
    return this.contentRef ? this.contentRef.instance.getTitle() : '';
  }

  public getPinName(type: 'in' | 'out', index: number): RsAsyncInput<string> {
    return this.contentRef ? this.contentRef.instance.getPinName(type, index) : '';
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

    const templateType = (
      this.templates ?
        this.templates.find(t => t[METADATA_ACCESSOR].type === this.item.type) :
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

  private render(useAnimations: boolean = false): void {
    useAnimations = useAnimations && typeof window.requestAnimationFrame === 'function';

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
}
