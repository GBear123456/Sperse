/** Core imports */
import {
    ChangeDetectionStrategy,
    Component,
    Output,
    EventEmitter,
    Inject,
    ElementRef,
    ChangeDetectorRef,
    AfterViewInit,
    HostListener
} from '@angular/core';

/** Third party imports */
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { of } from 'rxjs';

/** Application imports */
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { BankCodeService } from '@app/shared/common/bank-code/bank-code.service';
import {
    MemberSettingsServiceProxy,
    PersonContactServiceProxy,
    UpdatePersonBANKCodeInput,
    UpdateUserBANKCodeDto
} from '@shared/service-proxies/service-proxies';
import { LoadingService } from '@shared/common/loading-service/loading.service';
import { BankCodeDefinition } from '@app/shared/common/bank-code-letters/bank-code-definition.model';
import { BankCodeLetter } from '@app/shared/common/bank-code-letters/bank-code-letter.enum';

@Component({
    selector: 'bank-code-letters-editor',
    templateUrl: './bank-code-letters-editor-dialog.component.html',
    styleUrls: ['./bank-code-letters-editor-dialog.component.less'],
    providers: [MemberSettingsServiceProxy],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class BankCodeLettersEditorDialogComponent implements AfterViewInit {
    @Output() bankCodeChange: EventEmitter<string> = new EventEmitter<string>();
    bankCode: string;
    bankCodeInitial: string;
    personId: number = this.data.personId;
    bankCodeDefinitions: BankCodeDefinition[] = [
        { letter: BankCodeLetter.B, name: this.ls.l('Blueprint') },
        { letter: BankCodeLetter.A, name: this.ls.l('Action') },
        { letter: BankCodeLetter.N, name: this.ls.l('Nurturing') },
        { letter: BankCodeLetter.K, name: this.ls.l('Knowledge') }
    ];
    bankCodeIsEmpty: boolean;
    dontUpdateOnServer: boolean = this.data.dontUpdateOnServer;

    constructor(
        private elementRef: ElementRef,
        private loadingService: LoadingService,
        private personContactServiceProxy: PersonContactServiceProxy,
        private changeDetectorRef: ChangeDetectorRef,
        private memberSettingsService: MemberSettingsServiceProxy,
        private dialogRef: MatDialogRef<BankCodeLettersEditorDialogComponent>,
        public bankCodeService: BankCodeService,
        public ls: AppLocalizationService,
        @Inject(MAT_DIALOG_DATA) private data: any
    ) {
        this.bankCodeInitial = this.data.bankCode;
        this.bankCodeIsEmpty = this.data.bankCode === this.bankCodeService.emptyBankCode;
        this.bankCode = this.bankCodeIsEmpty ? 'BANK' : this.data.bankCode;
        this.resortDefinitions();

    }

    @HostListener('document:click', ['$event'])
    onDocumentClick(event) {
        if (!event.target.closest('#bankCodeLettersEditorDialog')) {
            this.close();
        }
    }

    ngAfterViewInit() {
        this.elementRef.nativeElement.closest(
            '.cdk-global-overlay-wrapper'
        ).style.zIndex = 1001;
    }

    drop(e: CdkDragDrop<BankCodeDefinition[]>) {
        if (e.currentIndex !== e.previousIndex) {
            moveItemInArray(this.bankCodeDefinitions, e.previousIndex, e.currentIndex);
            this.changeBankCode(this.bankCode[e.previousIndex] as BankCodeLetter, e.currentIndex);
        }
    }

    changeBankCode(bankCodeDefinitionLetter: BankCodeLetter, i: number) {
        const newBankCode = this.swap(
            this.bankCode,
            this.bankCode.indexOf(bankCodeDefinitionLetter.toString()),
            i
        );
        this.updateBankCode(newBankCode);
    }

    close() {
        if (!this.bankCodeIsEmpty && !this.dontUpdateOnServer && this.bankCode != this.bankCodeInitial) {
            const updateMethod$ =
                this.personId ?
                    this.personContactServiceProxy.updatePersonBANKCode(new UpdatePersonBANKCodeInput({
                        id: this.personId,
                        bankCode: this.bankCode
                    })) :
                    this.memberSettingsService.updateBANKCode(new UpdateUserBANKCodeDto({
                        bankCode: this.bankCode,
                        bankCodeSelfAssessmentDto: null,
                        source: 'CRM'
                    }));
            updateMethod$.subscribe(
                () => {
                    this.bankCodeChange.emit(this.bankCode);
                    this.dialogRef.close();
                },
                () => this.resortDefinitions
            );
        }
        else {
            this.dialogRef.close();
        }
    }

    updateBankCode(bankCode: string) {
        this.bankCode = bankCode;
        this.bankCodeIsEmpty = false;

        if (this.dontUpdateOnServer) {
            this.bankCodeChange.emit(this.bankCode);
        }

        this.changeDetectorRef.detectChanges();
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

    private swap(str: string, fromIndex: number, toIndex: number): string {
        return this.arrayMove(str.split(''), fromIndex, toIndex).join('');
    }

    private arrayMove(arr: string[], fromIndex: number, toIndex: number): string[] {
        let element = arr[fromIndex];
        arr.splice(fromIndex, 1);
        arr.splice(toIndex, 0, element);
        return arr;
    }

}
