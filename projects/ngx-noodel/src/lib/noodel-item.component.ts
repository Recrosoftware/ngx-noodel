import {AfterViewInit, Component, ElementRef, Input, ViewEncapsulation} from '@angular/core';
import {NoodelItemDescriptor, ViewProjection} from './models';

import {NoodelDefaultItemComponent} from './noodel-default-item.component';


@Component({
  selector: 'div[ngxNoodelItem]',
  template: `
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
    </div>

    <div class="node-content">
      <ng-container #customContentContainer></ng-container>
    </div>-->
  `,
  entryComponents: [
    NoodelDefaultItemComponent
  ],
  encapsulation: ViewEncapsulation.None
})
export class NoodelItemComponent implements AfterViewInit {
  @Input() public item: NoodelItemDescriptor;
  @Input() public parentProjection: ViewProjection;

  @Input() public animationDuration: number;
  @Input() public animationFunction: (start: number, end: number, t: number) => number;

  private animationRequestRef: number;

  private readonly projectionCurrent: ViewProjection;

  constructor(private el: ElementRef) {
    this.projectionCurrent = {x: 0, y: 0};
  }

  public ngAfterViewInit(): void {
    this.render();
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
