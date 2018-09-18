import {Component, ViewChild} from '@angular/core';
import {Naisc, NaiscItemDescriptor, NaiscMouseEvent} from '@naisc/core';
import {TestContentComponent} from './test-content.component';


@Component({
  selector: 'naisc-showcase',
  template: `
    <div naisc [templates]="templates"
         (clickLeft)="logMouse($event, 'left')"
         (clickRight)="logMouse($event, 'right')"></div>

    <button (click)="add()">ADD</button>
    <button (click)="remove()">REMOVE</button>
    <button (click)="addNew()">ADD_NEW</button>
    <button (click)="clear()">CLEAR</button>
    <button (click)="animate()">ANIMATE</button>
    <button (click)="undo()">UNDO</button>
    <button (click)="redo()">REDO</button>
    <button (click)="fit()">FIT</button>
    <button (click)="setCenter()">GOTO 100 100</button>
    <button (click)="setZoom()">ZOOM 3</button>
    <button (click)="dumpExport()">EXPORT</button>
    <button (click)="dumpImport()">IMPORT</button>

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
      'permanent': true,
      'title': 'Node Title',
      'pins-in': ['LinkName']
    }
  };

  private dump: string;

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

  public dumpExport(): void {
    this.dump = JSON.stringify(this.naisc.export());

    console.log(this.dump);
  }

  public dumpImport(): void {
    this.naisc.import(JSON.parse(this.dump));
  }

  public undo(): void {
    console.log('undo', this.naisc.undo());
  }

  public redo(): void {
    console.log('redo', this.naisc.redo());
  }

  public addNew(): void {
    this.naisc.add({
      type: 'node02',
      position: {x: Math.random() * 1000 - 500, y: Math.random() * 1000 - 500},
      pins: {
        in: [
          {type: 'c', multiple: true}
        ],
        out: [
          {type: 'c', multiple: true}
        ]
      },
      state: {
        'title': 'TestNode',
        'permanent': false
      }
    });
  }

  public clear(): void {
    this.naisc.clear();
  }

  public logMouse(evt: NaiscMouseEvent, action: string) {
    console.log(action, evt.localPosition.x, evt.localPosition.y);
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
