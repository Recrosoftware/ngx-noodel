import {AfterViewInit, Component, ViewChild} from '@angular/core';
import {Naisc, NaiscDump, NaiscItemDescriptor, NaiscMouseEvent} from '@naisc/core';
import {TestContentComponent} from './test-content.component';


@Component({
  selector: 'naisc-showcase',
  template: `
    <div naisc
         [readonly]="readonlyState"
         [templates]="templates"
         (stateChanged)="onState()"
         (clickLeft)="logMouse($event, 'left')"
         (clickRight)="logMouse($event, 'right')"></div>

    <button (click)="add()">ADD</button>
    <button (click)="remove()">REMOVE</button>
    <button (click)="addNew()">ADD_NEW</button>
    <button (click)="clear()">CLEAR</button>
    <button (click)="animate()">ANIMATE</button>
    <button (click)="doUndo()">UNDO</button>
    <button (click)="doRedo()">REDO</button>
    <button (click)="fit()">FIT</button>
    <button (click)="setCenter()">GOTO 100 100</button>
    <button (click)="setZoom()">ZOOM 3</button>
    <button (click)="dumpExport()">EXPORT</button>
    <button (click)="dumpImport()">IMPORT</button>

    <button (click)="addInstance()">ADD_INSTANCE</button>

    <button (click)="readonlyState = !readonlyState">TOGGLE READONLY</button>

    <button (click)="changeState()">CHANGE STATE</button>
  `,
  styles: [`
    div[naisc] {
      width: 1024px;
      height: 768px;
      border: 1px solid red;
    }
  `]
})
export class AppComponent implements AfterViewInit {
  @ViewChild(Naisc) public naisc: Naisc;

  public undoing = false;

  public state: NaiscDump;
  public undo: NaiscDump[] = [];
  public redo: NaiscDump[] = [];

  public readonlyState = false;

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

  public ngAfterViewInit(): void {
    this.state = this.naisc.export();
  }

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

  public doUndo(): void {
    if (this.undo.length > 0) {
      this.undoing = true;

      this.redo.splice(0, 0, this.state);
      this.state = this.undo.splice(0, 1)[0];
      this.naisc.import(this.state);
    }
  }

  public doRedo(): void {
    if (this.redo.length > 0) {
      this.undoing = true;

      this.undo.splice(0, 0, this.state);
      this.state = this.redo.splice(0, 1)[0];
      this.naisc.import(this.state);
    }
  }

  public onState(): void {
    if (this.undoing) {
      this.undoing = false;
      return;
    }

    this.redo.length = 0;

    if (this.state) {
      this.undo.splice(0, 0, this.state);
    }
    this.state = this.naisc.export();
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

  public changeState(): void {
    this.naisc.setState('state-key', Math.random());
  }
}
