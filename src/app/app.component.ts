import {Component, ViewChild} from '@angular/core';
import {NoodelComponent, NoodelItemDescriptor} from 'ngx-noodel';


@Component({
  selector: 'rs-root',
  template: `
    <div ngxNoodel></div>

    <button (click)="add()">ADD</button>
    <button (click)="remove()">REMOVE</button>
    <button (click)="addNew()">ADD_NEW</button>
    <button (click)="clear()">CLEAR</button>
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

  private readonly sameItem: NoodelItemDescriptor = {
    type: 'test',
    position: {x: 0, y: 0}
  };

  public add(): void {
    this.noodel.addItem(this.sameItem);
  }

  public remove(): void {
    this.noodel.removeItem(this.sameItem);
  }

  public addNew(): void {
    this.noodel.addItem({
      type: 'test',
      position: {x: Math.random() * 1000 - 500, y: Math.random() * 1000 - 500}
    });
  }

  public clear(): void {
    this.noodel.clearItems();
  }
}
