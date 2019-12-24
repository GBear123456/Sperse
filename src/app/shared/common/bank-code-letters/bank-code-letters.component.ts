/** Core imports */
import {
    ChangeDetectionStrategy, ChangeDetectorRef,
    Component,
    EventEmitter,
    HostBinding,
    Input,
    OnChanges,
    OnDestroy,
    Output,
    SimpleChanges
} from '@angular/core';

/** Third party imports */
import { MatDialog } from '@angular/material/dialog';

/** Application imports */
import { BankCodeLettersEditorDialogComponent } from '@app/shared/common/bank-code-letters/bank-code-letters-editor-dialog/bank-code-letters-editor-dialog.component';
import { DialogService } from '@app/shared/common/dialogs/dialog.service';
import { BankCodeService } from '@app/shared/common/bank-code/bank-code.service';

@Component({
    selector: 'bank-code-letters',
    templateUrl: './bank-code-letters.component.html',
    styleUrls: ['./bank-code-letters.component.less'],
    providers: [ DialogService ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class BankCodeLettersComponent implements OnChanges, OnDestroy {
    @Input() bankCode: string;
    @Input() showDescriptionsOnHover = false;
    @Input() personId: number;
    @Input() key = '';
    @Input() showBankCodeDefinition = false;
    @Input() showReportLink = false;
    @Input() reportLinkType: 'Sales' | 'Profile';
    @Input() reportIconName: string;
    @Input() editDialogPosition: { x?: number, y?: number };
    @Input() closeAfterEdit = false;
    @Output() bankCodeChange: EventEmitter<string> = new EventEmitter<string>();
    @HostBinding('class.allow-add') @Input() allowAdd = false;
    @HostBinding('class.allow-edit') @Input() allowEdit = false;
    bankCodeDefinition: string;

    constructor(
        private dialogService: DialogService,
        private changeDetectorRef: ChangeDetectorRef,
        public dialog: MatDialog,
        public bankCodeService: BankCodeService
    ) {}

    ngOnChanges(change: SimpleChanges) {
        if (change.bankCode && (this.showBankCodeDefinition || this.showReportLink)) {
            this.bankCodeDefinition = this.bankCodeService.getBankCodeDefinition(change.bankCode.currentValue[0]);
            this.changeDetectorRef.detectChanges();
        }
        if (change.allowAdd && change.allowAdd.currentValue && !this.bankCode) {
            this.bankCode = this.bankCodeService.emptyBankCode;
            this.changeDetectorRef.detectChanges();
        }
    }

    showEditPopup(e) {
        if (!this.dialog.getDialogById('bankCodeLettersEditorDialog')) {
            const editDialog = this.dialog.open(BankCodeLettersEditorDialogComponent, {
                id: 'bankCodeLettersEditorDialog',
                hasBackdrop: false,
                position: this.dialogService.calculateDialogPosition(
                    e,
                    e.target.closest('div'),
                    this.editDialogPosition && this.editDialogPosition.x || 200,
                    this.editDialogPosition && this.editDialogPosition.y || -12
                ),
                data: {
                    bankCode: this.bankCode,
                    personId: this.personId
                }
            });
            editDialog.componentInstance.bankCodeChange.subscribe((bankCode: string) => {
                this.bankCode = bankCode;
                this.bankCodeChange.emit(this.bankCode);
                this.changeDetectorRef.detectChanges();
                if (this.closeAfterEdit) {
                    editDialog.close();
                }
            });
            e.stopPropagation();
            e.preventDefault();
        }
    }

    get reportIconSrc() {
        return this.reportIconName || this.bankCode[0];
    }

    onLetterClick(e) {
        if (this.allowAdd && this.bankCode === this.bankCodeService.emptyBankCode) {
            this.showEditPopup(e);
        }
    }

    closeDialog() {
        const dialog = this.dialog.getDialogById('bankCodeLettersEditorDialog');
        if (dialog) {
            dialog.close();
        }
    }

    ngOnDestroy(): void {
        this.closeDialog();
    }
}
