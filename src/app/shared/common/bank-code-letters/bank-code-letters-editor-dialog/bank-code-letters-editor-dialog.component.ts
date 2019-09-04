/** Core imports */
import {
    ChangeDetectionStrategy,
    Component,
    Output,
    EventEmitter,
    Inject,
    ElementRef,
    ChangeDetectorRef
} from '@angular/core';

/** Third party imports */
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { finalize } from 'rxjs/operators';

/** Application imports */
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { BankCodeService } from '@app/shared/common/bank-code/bank-code.service';
import { PersonContactServiceProxy, UpdatePersonBANKCodeInput } from '@shared/service-proxies/service-proxies';
import { LoadingService } from '@shared/common/loading-service/loading.service';
import { BankCodeDefinition } from '@app/shared/common/bank-code-letters/bank-code-definition.model';
import { BankCodeLetter } from '@app/shared/common/bank-code-letters/bank-code-letter.enum';

@Component({
    selector: 'bank-code-letters-editor',
    templateUrl: './bank-code-letters-editor-dialog.component.html',
    styleUrls: ['./bank-code-letters-editor-dialog.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class BankCodeLettersEditorDialogComponent {
    bankCode: string;
    personId: number;
    @Output() bankCodeChange: EventEmitter<string> = new EventEmitter<string>();

    constructor(
        private ls: AppLocalizationService,
        private elementRef: ElementRef,
        private loadingService: LoadingService,
        private personContactServiceProxy: PersonContactServiceProxy,
        private changeDetectorRef: ChangeDetectorRef,
        public bankCodeService: BankCodeService,
        @Inject(MAT_DIALOG_DATA) data: any
    ) {
        this.bankCode = data.bankCode;
        this.personId = data.personId;
    }

    bankCodeDefinitions: BankCodeDefinition[] = [
        { letter: BankCodeLetter.B, name: this.ls.l('Blueprint') },
        { letter: BankCodeLetter.A, name: this.ls.l('Action') },
        { letter: BankCodeLetter.N, name: this.ls.l('Nurturing') },
        { letter: BankCodeLetter.K, name: this.ls.l('Knowledge') }
    ];

    isActive(bankCodeDefinition: BankCodeDefinition, i: number): boolean {
        return bankCodeDefinition.letter.toString() === this.bankCode[i];
    }

    changeBankCode(bankCodeDefinition: BankCodeDefinition, i: number) {
        if (this.isActive(bankCodeDefinition, i)) {
            return;
        }
        this.loadingService.startLoading(this.elementRef.nativeElement);
        const oldDefinitionLetter = this.bankCode[i];
        const newBankCode = this.swap(this.bankCode, bankCodeDefinition.letter.toString(), oldDefinitionLetter);
        this.personContactServiceProxy.updatePersonBANKCode(new UpdatePersonBANKCodeInput({
            id: this.personId,
            bankCode: newBankCode
        })).pipe(
            finalize(() => this.loadingService.finishLoading(this.elementRef.nativeElement))
        ).subscribe(() => {
            this.bankCode = newBankCode;
            this.bankCodeChange.emit(this.bankCode);
            this.changeDetectorRef.detectChanges();
        });
    }

    private swap(str: string, first: string, last: string): string {
        let arr = str.split('');
        const firstIndex = arr.indexOf(first);
        const lastIndex = arr.indexOf(last);
        arr[firstIndex] = last;
        arr[lastIndex] = first;
        return arr.join('');
    }

}
