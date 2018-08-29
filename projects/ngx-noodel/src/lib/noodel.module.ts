import {NgModule} from '@angular/core';
import {NoodelDefaultItemComponent} from './noodel-default-item.component';

import {NoodelItemComponent} from './noodel-item.component';
import {NoodelComponent} from './noodel.component';


@NgModule({
  declarations: [
    NoodelComponent,

    NoodelItemComponent,
    NoodelDefaultItemComponent
  ],
  exports: [NoodelComponent]
})
export class NoodelModule {
}
