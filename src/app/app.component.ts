import {Component, ViewChild} from '@angular/core';
import {NaiscComponent, NaiscItemDescriptor} from 'ngx-naisc';
import {TestContentComponent} from './test-content.component';


@Component({
  selector: 'rs-root',
  template: `
    <div ngxNaisc [templates]="templates"></div>

    <button (click)="add()">ADD</button>
    <button (click)="remove()">REMOVE</button>
    <button (click)="addNew()">ADD_NEW</button>
    <button (click)="clear()">CLEAR</button>

    <button (click)="addInstance()">ADD_INSTANCE</button>
  `,
  styles: [`
    div[ngxNaisc] {
      width: 1024px;
      height: 768px;
      border: 1px solid red;
    }
  `]
})
export class AppComponent {
  @ViewChild(NaiscComponent) public naisc: NaiscComponent;

  public templates = [
    TestContentComponent
  ];

  private readonly sameItem: NaiscItemDescriptor = {
    type: 'test',
    position: {x: 0, y: 0},
    state: {'title': 'Node Title'}
  };

  public addInstance(): void {
    this.naisc.instantiateFrom(TestContentComponent);
  }

  public add(): void {
    this.naisc.add(this.sameItem);
  }

  public remove(): void {
    this.naisc.remove(this.sameItem);
  }

  public addNew(): void {
    this.naisc.add({
      type: 'test',
      position: {x: Math.random() * 1000 - 500, y: Math.random() * 1000 - 500},
      state: {'title': 'TestNode'}
    });
  }

  public clear(): void {
    this.naisc.clear();
  }
}
