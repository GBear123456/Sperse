/** Core imports */
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
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
import { FeatureCheckerService } from 'abp-ng2-module';
import { BankCodeLettersEditorDialogComponent } from '@app/shared/common/bank-code-letters/bank-code-letters-editor-dialog/bank-code-letters-editor-dialog.component';
import { BankCodeHistoryDialogComponent } from './bank-code-history-dialog/bank-code-history-dialog.component'
import { DialogService } from '@app/shared/common/dialogs/dialog.service';
import { BankCodeService } from '@app/shared/common/bank-code/bank-code.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { AppFeatures } from '@shared/AppFeatures';
import { DynamicMatDialog } from '@shared/common/dialogs/dynamic-overlay/dynamic-dialog';
import { DYNAMIC_MAT_DIALOG_PROVIDERS } from '@shared/common/dialogs/dynamic-overlay/dynamic-overlay.module';

@Component({
    selector: 'bank-code-letters',
    templateUrl: './bank-code-letters.component.html',
    styleUrls: ['./bank-code-letters.component.less'],
    providers: DYNAMIC_MAT_DIALOG_PROVIDERS,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class BankCodeLettersComponent implements OnChanges, OnDestroy {
    @Input() key = '';
    @Input() bankCode: string | '????';
    @Input() personId: number;
    @Input() showDialogOnBottom = false;
    @Input() showDescriptionsOnHover = false;
    @Input() showDescriptionsOnClick = false;
    @Input() showBankCodeDefinition = false;
    @Input() showReportLink = false;
    @Input() showHistoryLink = false;
    @Input() reportLinkType: 'Sales' | 'Profile' = 'Sales';
    @Input() reportIconName: string;
    @Input() editDialogPosition: { x?: number, y?: number };
    @Input() updateOnServerAfterEdit = true;
    @Output() bankCodeChange: EventEmitter<string> = new EventEmitter<string>();
    @HostBinding('class.active') @Input() active = true;
    @HostBinding('class.allow-add') @Input() allowAdd = false;
    @HostBinding('class.allow-edit') @Input() allowEdit = false;
    bankCodeDefinition: string;
    editPopupIsOpened = false;
    hasBankCodeFeature = this.features.isEnabled(AppFeatures.CRMBANKCode);
    resolutions = [
        {
            text: this.ls.l('Standard'),
            size: '3MB',
            value: 'standard'
        },
        {
            text: this.ls.l('Hi-Res'),
            size: '30MB',
            value: 'hires'
        }
    ];
    selectedResolution = this.resolutions[0].value;
    languages = [
        {
            code: 'EN',
            text: this.ls.l('English')
        },
        {
            code: 'AR',
            text: this.ls.l('Arabic')
        },
        {
            code: 'RU',
            text: this.ls.l('Russian')
        },
        {
            code: 'ES',
            text: this.ls.l('Spanish')
        },
        {
            code: 'DE',
            text: this.ls.l('German')
        },
        {
            code: 'EL',
            text: this.ls.l('Greek')
        }
    ];
    showTooltip = false;
    reportTypes = [
        {
            displayName: this.ls.l('Sales'),
            type: 'sales',
            folder: 'Sales'
        },
        {
            displayName: this.ls.l('Profile'),
            type: 'profile',
            folder: 'Prospects'
        }
    ];
    selectedReportType = this.reportTypes[0];

    constructor(
        private changeDetectorRef: ChangeDetectorRef,
        public dialog: MatDialog,
        public customDialog: DynamicMatDialog,
        public bankCodeService: BankCodeService,
        public features: FeatureCheckerService,
        public ls: AppLocalizationService
    ) {
    }

    ngOnChanges(change: SimpleChanges) {
        if (change.bankCode && change.bankCode.currentValue && (this.showBankCodeDefinition || this.showReportLink)) {
            this.bankCodeDefinition = this.bankCodeService.getBankCodeDefinition(change.bankCode.currentValue[0]);
            this.changeDetectorRef.detectChanges();
        }
        if (change.allowAdd && change.allowAdd.currentValue && !this.bankCode) {
            this.bankCode = this.bankCodeService.emptyBankCode;
            this.changeDetectorRef.detectChanges();
        }
    }

    get resolution() {
        return this.selectedResolution === 'hires' ? '-' + this.selectedResolution.toUpperCase() : '';
    }

    showEditPopup(e) {
        if (!this.dialog.getDialogById('bankCodeLettersEditorDialog')) {
            this.editPopupIsOpened = true;
            const editDialog = this.customDialog.open(BankCodeLettersEditorDialogComponent, {
                id: 'bankCodeLettersEditorDialog',
                hasBackdrop: false,
                backdropClass: 'no-backdrop',
                position: DialogService.calculateDialogPosition(
                    e,
                    e.target.closest('div'),
                    this.editDialogPosition && this.editDialogPosition.x || 200,
                    this.editDialogPosition && this.editDialogPosition.y || (
                        this.showDialogOnBottom ? -20 : 170
                    )
                ),
                data: {
                    bankCode: this.bankCode,
                    personId: this.personId,
                    dontUpdateOnServer: !this.updateOnServerAfterEdit
                }
            });
            editDialog.afterClosed().subscribe(() => {
                this.editPopupIsOpened = false;
                this.changeDetectorRef.detectChanges();
            });
            editDialog.componentInstance.bankCodeChange.subscribe((bankCode: string) => {
                this.bankCode = bankCode;
                this.bankCodeChange.emit(this.bankCode);
                this.changeDetectorRef.detectChanges();
            });
            e.stopPropagation();
            e.preventDefault();
        }
    }

    get reportIconSrc() {
        return './assets/common/images/bank-code/download-icon-' + (this.reportIconName || this.bankCode[0]) + '.png';
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

    salesButtonClick(e) {
        this.showTooltip = !this.showTooltip;
        e.preventDefault();
        e.stopPropagation();
    }

    showBankCodeHistory(event) {
        event.stopPropagation();
        this.dialog.open(BankCodeHistoryDialogComponent, {
            panelClass: 'slider',
            disableClose: true,
            closeOnNavigation: false,
            data: {
                contactId: this.personId
            }
        }).afterClosed().subscribe(() => {
        });
    }

    ngOnDestroy(): void {
        this.closeDialog();
    }
}
