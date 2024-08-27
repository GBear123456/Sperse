import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CurrencySelectorComponent } from './currency-selector.component';
import { DxSelectBoxModule } from 'devextreme-angular/ui/select-box';
import { DxValidatorModule } from 'devextreme-angular/ui/validator';
import { DxTextBoxModule } from 'devextreme-angular/ui/text-box';
import { CurrencyCRMService } from 'store/currencies-crm-store/currency.service';


@NgModule({
    imports: [
        CommonModule,
        DxSelectBoxModule,
        DxTextBoxModule,
        DxValidatorModule
    ],
    exports: [CurrencySelectorComponent],
    declarations: [CurrencySelectorComponent],
    providers: [CurrencyCRMService]
})
export class CurrencySelectorModule { }