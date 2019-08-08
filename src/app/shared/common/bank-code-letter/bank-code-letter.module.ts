import { NgModule } from '@angular/core';
import { BankCodeLetterComponent } from '@app/shared/common/bank-code-letter/bank-code-letter.component';
import { CommonModule } from '@angular/common';

@NgModule({
    imports: [
        CommonModule
    ],
    declarations: [
        BankCodeLetterComponent
    ],
    exports: [
        BankCodeLetterComponent
    ]
})
export class BankCodeLetterModule {}
