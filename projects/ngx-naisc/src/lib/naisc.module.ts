import {NgModule} from '@angular/core';

import {AsyncPipe} from './internal';
import {NaiscDefaultItemComponent} from './naisc-default-item.component';

import {NaiscItemComponent} from './naisc-item.component';
import {NaiscComponent} from './naisc.component';


@NgModule({
  declarations: [
    NaiscComponent,

    NaiscItemComponent,
    NaiscDefaultItemComponent,

    AsyncPipe
  ],
  exports: [NaiscComponent]
})
export class NaiscModule {
}
