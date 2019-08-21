import { NgModule } from '@angular/core';
import { BankCodeLetterComponent } from '@app/shared/common/bank-code-letters/bank-code-letter/bank-code-letter.component';
import { CommonModule } from '@angular/common';
import { BankCodeLettersComponent } from '@app/shared/common/bank-code-letters/bank-code-letters.component';

@NgModule({
    imports: [
        CommonModule
    ],
    declarations: [
        BankCodeLettersComponent,
        BankCodeLetterComponent
    ],
    exports: [
        BankCodeLetterComponent,
        BankCodeLettersComponent
    ]
})
export class BankCodeLettersModule {}
