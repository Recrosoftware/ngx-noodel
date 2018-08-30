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
import {Observable} from 'rxjs';

import {METADATA_ACCESSOR, ViewProjection} from './internal';

import {NoodelDefaultItemComponent} from './noodel-default-item.component';

import {NoodelItemContent, NoodelItemDescriptor} from './shared';


@Component({
  selector: 'div[ngxNoodelItem]',
  template: `
    <div class="noodel-item-track-bar">
      {{title | async}}
    </div>

    <div>
      <ng-container #itemContentContainer></ng-container>
    </div>
    <!--<div #trackBar class="track-bar">
      {{node.title | translate}}

      <i *ngIf="!node.permanent" (click)="remove()"
         class="remove-button fa fa-fw fa-window-close"></i>
    </div>

    <div class="link-container">
      <ul class="link-in">
        <li *ngFor="let link of node.linkIn">
          <span>{{link.name | translate}}</span>
          <div ibNodeLink type="input"
               [node]="node" [link]="link" [instance]="instance"
               [container]="el" [containerX]="currentX" [containerY]="currentY"></div>
        </li>
      </ul>
      <ul class="link-out">
        <li *ngFor="let link of node.linkOut">
          <span>{{link.name | translate}}</span>

          <div ibNodeLink type="output"
               [node]="node" [link]="link" [instance]="instance"
               [container]="el" [containerX]="currentX" [containerY]="currentY"></div>
        </li>
      </ul>
    </div>-->
  `,
  entryComponents: [
    NoodelDefaultItemComponent
  ],
  encapsulation: ViewEncapsulation.None
})
export class NoodelItemComponent implements AfterViewInit {
  @ViewChild('itemContentContainer', {read: ViewContainerRef}) public itemContentContainer: ViewContainerRef;

  @Input() public item: NoodelItemDescriptor;
  @Input() public parentProjection: ViewProjection;

  @Input() public animationDuration: number;
  @Input() public animationFunction: (start: number, end: number, t: number) => number;

  @Input() public templates: Type<NoodelItemContent>[];

  public get title(): string | Promise<String> | Observable<string> {
    return this.contentRef ? this.contentRef.instance.title : '';
  }

  private contentRef: ComponentRef<NoodelItemContent>;
  private contentRefType: Type<NoodelItemContent>;

  private animationRequestRef: number;
  private readonly projectionCurrent: ViewProjection;

  constructor(private el: ElementRef,
              private resolver: ComponentFactoryResolver) {
    this.projectionCurrent = {x: 0, y: 0};
  }

  public ngAfterViewInit(): void {
    this.render();

    setTimeout(() => this.updateContentTemplate());
  }

  public updateContentTemplate(): void {
    if (!this.itemContentContainer) {
      return;
    }

    const templateType = (
      this.templates ?
        this.templates.find(t => t[METADATA_ACCESSOR].type === this.item.type) :
        null
    ) || NoodelDefaultItemComponent;

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
