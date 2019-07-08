import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { BankCodeWizzardComponent } from './bank-code-wizzard.component';
import { MatTabsModule } from '@angular/material/tabs';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { BankCodeWizzardTabsComponent } from './bank-code-wizzard-tabs/bank-code-wizzard-tabs.component';

@NgModule({
    imports: [
        CommonModule,
        BrowserAnimationsModule,
        FormsModule,
        MatTabsModule
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
