import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';

import {RsAsyncPipe} from './common/rs-async.pipe';

import {Naisc} from './naisc';

import {NaiscDefaultItemComponent} from './naisc-default-item.component';
import {NaiscItemLinkDirective} from './naisc-item-link.directive';
import {NaiscItemPinDirective} from './naisc-item-pin.directive';
import {NaiscItemComponent} from './naisc-item.component';


@NgModule({
  imports: [CommonModule],
  declarations: [
    Naisc,

    NaiscItemComponent,
    NaiscItemLinkDirective,
    NaiscItemPinDirective,
    NaiscDefaultItemComponent,

    RsAsyncPipe
  ],
  exports: [Naisc]
})
export class NaiscModule {
}
