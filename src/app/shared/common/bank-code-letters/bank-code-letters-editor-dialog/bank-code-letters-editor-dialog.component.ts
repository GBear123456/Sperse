/** Core imports */
import {
    ChangeDetectionStrategy,
    Component,
    Output,
    EventEmitter,
    Inject,
    ElementRef,
    ChangeDetectorRef,
    OnDestroy,
    OnInit
} from '@angular/core';

/** Third party imports */
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { DragulaService } from 'ng2-dragula';

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
export class BankCodeLettersEditorDialogComponent implements OnInit, OnDestroy {
    @Output() bankCodeChange: EventEmitter<string> = new EventEmitter<string>();
    bankCode: string;
    personId: number;
    dragDropSubscription: Subscription = new Subscription();
    bankCodeDefinitions: BankCodeDefinition[] = [
        { letter: BankCodeLetter.B, name: this.ls.l('Blueprint') },
        { letter: BankCodeLetter.A, name: this.ls.l('Action') },
        { letter: BankCodeLetter.N, name: this.ls.l('Nurturing') },
        { letter: BankCodeLetter.K, name: this.ls.l('Knowledge') }
    ];
    dragDropName = 'bankCodeDefinitions';

    constructor(
        private ls: AppLocalizationService,
        private elementRef: ElementRef,
        private loadingService: LoadingService,
        private personContactServiceProxy: PersonContactServiceProxy,
        private changeDetectorRef: ChangeDetectorRef,
        private dragulaService: DragulaService,
        public bankCodeService: BankCodeService,
        @Inject(MAT_DIALOG_DATA) data: any
    ) {
        this.bankCode = data.bankCode;
        this.resortDefinitions();
        this.personId = data.personId;
    }

    ngOnInit() {
        this.dragDropSubscription.add(this.dragulaService.drop.subscribe((dropObject) => {
            const name = dropObject[1].getAttribute('definitionLetter');
            const el = dropObject[1];
            const newIndex = Array.prototype.indexOf.call(dropObject[2].children, el);
            this.changeBankCode(name, newIndex);
        }));
        this.dragDropSubscription.add(this.dragulaService.setOptions(this.dragDropName, {
            direction: 'horizontal'
        }));
    }

    changeBankCode(bankCodeDefinitionLetter: BankCodeLetter, i: number) {
        this.loadingService.startLoading(this.elementRef.nativeElement);
        const oldDefinitionLetter = this.bankCode[i];
        const newBankCode = this.swap(this.bankCode, bankCodeDefinitionLetter.toString(), oldDefinitionLetter);
        this.personContactServiceProxy.updatePersonBANKCode(new UpdatePersonBANKCodeInput({
            id: this.personId,
            bankCode: newBankCode
        })).pipe(
            finalize(() => this.loadingService.finishLoading(this.elementRef.nativeElement))
        ).subscribe(
            () => {
                this.bankCode = newBankCode;
                this.bankCodeChange.emit(this.bankCode);
                this.changeDetectorRef.detectChanges();
            },
            () => this.resortDefinitions
        );
    }

    private resortDefinitions() {
        this.bankCodeDefinitions.sort((definitionA: BankCodeDefinition, definitionB: BankCodeDefinition) => {
            const definitionAIndex = this.bankCode.indexOf(definitionA.letter);
            const definitionBIndex = this.bankCode.indexOf(definitionB.letter);
            return definitionAIndex > definitionBIndex
                ? 1
                : (definitionAIndex === definitionBIndex ? 0 : -1);
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

    ngOnDestroy() {
        this.dragDropSubscription.unsubscribe();
        this.dragulaService.destroy(this.dragDropName);
    }

}
