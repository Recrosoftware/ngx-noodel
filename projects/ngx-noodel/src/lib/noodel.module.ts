import {NgModule} from '@angular/core';

import {AsyncPipe} from './internal';
import {NoodelDefaultItemComponent} from './noodel-default-item.component';

import {NoodelItemComponent} from './noodel-item.component';
import {NoodelComponent} from './noodel.component';


@NgModule({
  declarations: [
    NoodelComponent,

    NoodelItemComponent,
    NoodelDefaultItemComponent,

    AsyncPipe
  ],
  exports: [NoodelComponent]
})
export class NoodelModule {
}
