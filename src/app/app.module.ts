import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';

import {NaiscModule} from '@naisc/core';

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
    NaiscModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {
}
