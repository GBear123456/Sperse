/** Application imports */
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { AppRoutingModule } from './app-routing.module';

/** Third party imports */

/** Application imports */
import { AppComponent } from './app.component';
import { BankCodeWizzardModule } from '@shared/bank-code-wizzard/bank-code-wizzard.module';

@NgModule({
    declarations: [
        AppComponent
    ],
    imports: [
        BrowserModule,
        AppRoutingModule,
        BankCodeWizzardModule
    ],
    providers: [],
    bootstrap: [AppComponent]
})
export class AppModule {
    constructor() {
    }
}
