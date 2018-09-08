import {Component, ViewChild} from '@angular/core';
import {Naisc, NaiscItemDescriptor} from '@naisc/core';
import {TestContentComponent} from './test-content.component';


@Component({
  selector: 'rs-root',
  template: `
    <div naisc [templates]="templates"></div>

    <button (click)="add()">ADD</button>
    <button (click)="remove()">REMOVE</button>
    <button (click)="addNew()">ADD_NEW</button>
    <button (click)="clear()">CLEAR</button>
    <button (click)="animate()">ANIMATE</button>
    <button (click)="fit()">FIT</button>
    <button (click)="setCenter()">GOTO 100 100</button>
    <button (click)="setZoom()">ZOOM 3</button>

    <button (click)="addInstance()">ADD_INSTANCE</button>
  `,
  styles: [`
    div[naisc] {
      width: 1024px;
      height: 768px;
      border: 1px solid red;
    }
  `]
})
export class AppComponent {
  @ViewChild(Naisc) public naisc: Naisc;

  public templates = [
    TestContentComponent
  ];

  private animationTimer: any;

  private readonly sameItem: NaiscItemDescriptor = {
    type: 'node01',
    permanent: false,
    position: {x: 0, y: 0},
    pins: {
      in: [
        {
          'type': 'a',
          'multiple': true
        }
      ],
      out: []
    },
    state: {
      'title': 'Node Title',
      'pins-in': ['LinkName']
    }
  };

  public fit() {
    this.naisc.fitView();
  }

  public addInstance(): void {
    this.naisc.instantiateFrom(TestContentComponent);
  }

  public add(): void {
    this.naisc.add(this.sameItem);
  }

  public remove(): void {
    this.naisc.remove(this.sameItem);
  }

  public setCenter(): void {
    this.naisc.setCenter({x: 100, y: 100});
  }

  public setZoom(): void {
    this.naisc.setZoom(3);
  }

  public addNew(): void {
    this.naisc.add({
      type: 'node02',
      permanent: false,
      position: {x: Math.random() * 1000 - 500, y: Math.random() * 1000 - 500},
      pins: {
        in: [],
        out: []
      },
      state: {'title': 'TestNode'}
    });
  }

  public clear(): void {
    this.naisc.clear();
  }

  public animate(): void {
    if (this.animationTimer) {
      clearInterval(this.animationTimer);
      this.animationTimer = null;
      return;
    }

    const startTime = Date.now();
    this.animationTimer = setInterval(() => {
      const diff = (Date.now() - startTime) / 1000;

      const x = Math.sin(diff);
      const y = Math.sin(diff + Math.PI / 2);

      this.sameItem.position.x = x * 200;
      this.sameItem.position.y = y * 200;

      this.naisc.requestRender();
    }, 100);
  }
}
