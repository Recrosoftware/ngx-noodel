import {Component, ViewChild} from '@angular/core';
import {NoodelComponent, NoodelItemDescriptor} from 'ngx-noodel';
import {TestContentComponent} from './test-content.component';


@Component({
  selector: 'rs-root',
  template: `
    <div ngxNoodel [templates]="templates"></div>

    <button (click)="add()">ADD</button>
    <button (click)="remove()">REMOVE</button>
    <button (click)="addNew()">ADD_NEW</button>
    <button (click)="clear()">CLEAR</button>

    <button (click)="addInstance()">ADD_INSTANCE</button>
  `,
  styles: [`
    div[ngxNoodel] {
      width: 1024px;
      height: 768px;
      border: 1px solid red;
    }
  `]
})
export class AppComponent {
  @ViewChild(NoodelComponent) public noodel: NoodelComponent;

  public templates = [
    TestContentComponent
  ];

  private readonly sameItem: NoodelItemDescriptor = {
    type: 'test',
    position: {x: 0, y: 0},
    state: {'title': 'Node Title'}
  };

  public addInstance(): void {
    this.noodel.instantiateFrom(TestContentComponent);
  }

  public add(): void {
    this.noodel.add(this.sameItem);
  }

  public remove(): void {
    this.noodel.remove(this.sameItem);
  }

  public addNew(): void {
    this.noodel.add({
      type: 'test',
      position: {x: Math.random() * 1000 - 500, y: Math.random() * 1000 - 500},
      state: {'title': 'TestNode'}
    });
  }

  public clear(): void {
    this.noodel.clear();
  }
}
