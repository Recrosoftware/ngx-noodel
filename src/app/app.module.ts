import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';

import {NoodelModule} from 'ngx-noodel';

import {AppComponent} from './app.component';


@NgModule({
  declarations: [
    AppComponent
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
