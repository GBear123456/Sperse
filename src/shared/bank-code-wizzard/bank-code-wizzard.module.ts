/** Core imports */
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

/** Third party modules */
import { MatTabsModule } from '@angular/material/tabs';
import { ChartModule } from 'angular2-chartjs';

/** Application imports */
import { BankCodeWizzardComponent } from './bank-code-wizzard.component';
import { BankCodeWizzardTabsComponent } from './bank-code-wizzard-tabs/bank-code-wizzard-tabs.component';

@NgModule({
    imports: [
        CommonModule,
        BrowserAnimationsModule,
        FormsModule,
        MatTabsModule,
        ChartModule
    ],
    declarations: [
        BankCodeWizzardComponent,
        BankCodeWizzardTabsComponent
    ],
    exports: [
        BankCodeWizzardComponent
    ]
})
export class BankCodeWizzardModule {
}
