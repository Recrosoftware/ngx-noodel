import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';

import {NoodelModule} from 'ngx-noodel';

import {AppComponent} from './app.component';
import {TestContentComponent} from './test-content.component';


@NgModule({
  declarations: [
    AppComponent,

    TestContentComponent
  ],
  entryComponents: [
    TestContentComponent
  ],
  imports: [
    BrowserModule,
    NoodelModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {
}
