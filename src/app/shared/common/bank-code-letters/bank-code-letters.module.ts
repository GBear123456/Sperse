/** Core imoports */
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

/** Third party imports */
import { DxTooltipModule } from 'devextreme-angular';

/** Application imports */
import { BankCodeLetterComponent } from '@app/shared/common/bank-code-letters/bank-code-letter/bank-code-letter.component';
import { BankCodeLettersComponent } from '@app/shared/common/bank-code-letters/bank-code-letters.component';
import { BankCodeService } from '@app/shared/common/bank-code/bank-code.service';

@NgModule({
    imports: [
        CommonModule,
        DxTooltipModule
    ],
    declarations: [
        BankCodeLettersComponent,
        BankCodeLetterComponent
    ],
    exports: [
        BankCodeLetterComponent,
        BankCodeLettersComponent
    ],
    providers: [
        BankCodeService
    ]
})
export class BankCodeLettersModule {}
