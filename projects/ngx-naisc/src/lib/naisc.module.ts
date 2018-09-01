import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {RsAsyncPipe} from './common';
import {Naisc} from './naisc';
import {NaiscDefaultItemComponent} from './naisc-default-item.component';
import {NaiscItemPinDirective} from './naisc-item-pin.directive';
import {NaiscItemComponent} from './naisc-item.component';


@NgModule({
  imports: [CommonModule],
  declarations: [
    Naisc,

    NaiscItemComponent,
    NaiscItemPinDirective,
    NaiscDefaultItemComponent,

    RsAsyncPipe
  ],
  exports: [Naisc]
})
export class NaiscModule {
}
