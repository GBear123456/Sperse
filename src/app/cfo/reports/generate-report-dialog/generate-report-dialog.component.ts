/** Core imports */
import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

/** Third party imports */
import moment from 'moment-timezone';
import { NotifyService } from 'abp-ng2-module/dist/src/notify/notify.service';
import { DxTreeListComponent } from 'devextreme-angular/ui/tree-list';
import { DxTextBoxComponent } from '@root/node_modules/devextreme-angular';
import { forkJoin } from 'rxjs';
import { first, switchMap, tap, finalize } from 'rxjs/operators';
import { select, Store } from '@ngrx/store';

/** Application imports */
import { DateHelper } from '@shared/helpers/DateHelper';
import { IDialogButton } from '@root/shared/common/dialogs/modal/dialog-button.interface';
import { ModalDialogComponent } from '@root/shared/common/dialogs/modal/modal-dialog.component';
import { BankAccountsService } from '@root/shared/cfo/bank-accounts/helpers/bank-accounts.service';
import {
    ReportsServiceProxy,
    GenerateInput,
    InstanceServiceProxy,
    InstanceType
} from '@root/shared/service-proxies/service-proxies';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { GenerateReportStep } from './generate-report-step.enum';
import { CfoStore, CurrenciesStoreSelectors } from '@app/cfo/store';
import { CFOService } from '@shared/cfo/cfo.service';
import { AppConsts } from '@shared/AppConsts';
import { SendReportNotificationInput } from '@shared/service-proxies/service-proxies';

@Component({
    templateUrl: 'generate-report-dialog.component.html',
    styleUrls: [
        '../report-dialog.less',
        'generate-report-dialog.component.less'
    ],
    providers: [ ReportsServiceProxy ]
})
export class GenerateReportDialogComponent implements OnInit {
    @ViewChild(DxTreeListComponent) treeList: DxTreeListComponent;
    @ViewChild(ModalDialogComponent) modalDialog: ModalDialogComponent;
    @ViewChild('notificationToEmailTextBox') notificationToEmailTextBox: DxTextBoxComponent;

    title = this.ls.l('SelectBusinessEntity');
    initButtons: IDialogButton[] = [
        {
            title: this.ls.l('Back'),
            class: 'default',
            disabled: true,
            action: this.prev.bind(this)
        },
        {
            id: 'next',
            title: this.ls.l('Next'),
            class: 'primary saveButton',
            action: this.next.bind(this),
            disabled: true
        }
    ];
    buttons: IDialogButton[] = this.initButtons;
    currentStep = GenerateReportStep.Step1;
    generateReportSteps = GenerateReportStep;
    selectedBusinessEntityIds: any = [];
    dateFrom = moment.utc().subtract(1, 'month').startOf('month');
    dateTo = moment.utc().subtract(1, 'month').endOf('month');
    calendarData = {
        from: { value: DateHelper.addTimezoneOffset(this.dateFrom.toDate()) },
        to: { value: DateHelper.addTimezoneOffset(this.dateTo.toDate()) },
        options: {
            showAllAvailableDatesButton: false
        }
    };
    radioGroupGrouping = [
        { text: 'Separate', value: true },
        { text: 'Combined', value: false }
    ];
    isSeparateGrouping = true;
    notificationToEmail: string;
    sendReportInAttachments = false;
    emailRegEx = AppConsts.regexPatterns.email;
    dontSendEmailNotification = false;

    private readonly BACK_BTN_INDEX = 0;
    private readonly NEXT_BTN_INDEX = 1;

    constructor(
        @Inject(MAT_DIALOG_DATA) public data: any,
        private reportsProxy: ReportsServiceProxy,
        private notify: NotifyService,
        private store$: Store<CfoStore.State>,
        private dialogRef: MatDialogRef<GenerateReportDialogComponent>,
        private instanceAppService: InstanceServiceProxy,
        public cfoService: CFOService,
        public bankAccountsService: BankAccountsService,
        public ls: AppLocalizationService
    ) {
        this.dialogRef['_overlayRef'].hostElement.classList.add('generate-report');
    }

    ngOnInit() {
        this.instanceAppService.getInstanceOwnerEmailAddress(
            this.cfoService.instanceType as InstanceType,
            this.cfoService.instanceId
        ).subscribe((ownerEmail: string) => {
            this.notificationToEmail = ownerEmail;
        });
        this.bankAccountsService.load();
    }

    /**
     * Return GenerateInput
     * @param {string} currencyId
     * @param {number[]} businessEntityIds
     * @return {GenerateInput}
     */
    private getGenerateInput(currencyId: string, businessEntityIds: number[]): GenerateInput {
        return new GenerateInput({
            from: this.dateFrom && DateHelper.getDateWithoutTime(this.dateFrom),
            to: this.dateTo && DateHelper.getDateWithoutTime(this.dateTo),
            period: this.data.period,
            currencyId,
            businessEntityIds: businessEntityIds,
            bankAccountIds: [],
            notificationData: !this.dontSendEmailNotification && !this.cfoService.isMainInstanceType && this.emailIsValidAndNotEmpty
                ? new SendReportNotificationInput({
                    reportId: null,
                    recipientUserEmailAddress: this.notificationToEmail,
                    sendReportInAttachments: this.sendReportInAttachments
                })
                : null
        });
    }

    private applyDateRange() {
        let dateFrom = this.calendarData.from.value && DateHelper.removeTimezoneOffset(this.calendarData.from.value);
        let dateTo = this.calendarData.to.value ? DateHelper.removeTimezoneOffset(this.calendarData.to.value) : dateFrom;
        if ((this.dateTo ? this.dateTo.diff(dateTo, 'days') : dateTo) ||
            (this.dateFrom ? this.dateFrom.diff(dateFrom, 'days') : dateFrom)
        ) {
            this.dateFrom = dateFrom && moment(dateFrom);
            this.dateTo = dateTo && moment(dateTo);
        }
    }

    private prev() {
        this.currentStep--;
        this.processStep();
    }

    private next() {
        this.currentStep++;
        if (this.currentStep == GenerateReportStep.Step2) {
            this.applyBusinessEntity();
        }
        if (this.currentStep == GenerateReportStep.Step3) {
            this.applyDateRange();
        }
        this.processStep();
    }

    private processStep() {
        this.buttons = this.initButtons;
        if (this.currentStep == GenerateReportStep.Step1) {
            this.title = this.ls.l('SelectBusinessEntity');
            this.buttons[this.NEXT_BTN_INDEX].title = this.ls.l('Next');
            this.buttons[this.NEXT_BTN_INDEX].action = this.next.bind(this);
            this.buttons[this.BACK_BTN_INDEX].disabled = true;
        }
        if (this.currentStep == GenerateReportStep.Step2) {
            this.title = this.ls.l('SelectDateRange');
            this.buttons[this.NEXT_BTN_INDEX].title = this.ls.l('Next');
            this.buttons[this.NEXT_BTN_INDEX].action = this.next.bind(this);
            this.buttons[this.BACK_BTN_INDEX].disabled = false;
        }
        if (this.currentStep == GenerateReportStep.Step3) {
            this.title = this.ls.l('ReportGenerationOptions');
            this.buttons = null;
        }
    }

    private applyBusinessEntity() {
        this.bankAccountsService.changeSelectedBusinessEntities(
            this.selectedBusinessEntityIds = this.treeList.instance.getVisibleRows()
                .filter((item) => item.isSelected)
                .map(item => item.key)
        );
    }

    get emailIsValidAndNotEmpty(): boolean {
        return this.notificationToEmail && this.notificationToEmailTextBox && this.notificationToEmailTextBox.instance.option('isValid');
    }

    get emailIsValid(): boolean {
        return this.notificationToEmailTextBox && this.notificationToEmailTextBox.instance && this.notificationToEmailTextBox.instance.option('isValid');
    }

    editDate() {
        this.currentStep = GenerateReportStep.Step2;
        this.processStep();
    }

    editBusinessEntities() {
        this.currentStep = GenerateReportStep.Step1;
        this.processStep();
    }

    generateReport() {
        this.modalDialog.startLoading();
        this.store$.pipe(
            select(CurrenciesStoreSelectors.getSelectedCurrencyId),
            first(),
            tap(() => this.notify.info(this.ls.l('GeneratingStarted'))),
            switchMap((currencyId: string) => {
                return this.isSeparateGrouping
                    ? forkJoin(this.selectedBusinessEntityIds.map(param => {
                        return this.reportsProxy.generate(
                            <any>this.data.instanceType,
                            this.data.instanceId,
                            this.getGenerateInput(currencyId, [+param])
                        );
                    }))
                    : this.reportsProxy.generate(
                        <any>this.data.instanceType,
                        this.data.instanceId,
                        this.getGenerateInput(currencyId, this.selectedBusinessEntityIds)
                    );
            }),
            finalize(() => {
                this.modalDialog.finishLoading();
                this.modalDialog.close(true);
            })
        ).subscribe(
            () => {
                this.data.reportGenerated();
                this.notify.info(this.ls.l('SuccessfullyGenerated'));
            },
            () => {
                this.notify.error(this.ls.l('GenerationFailed'));
            }
        );
    }

    onContentReady(event) {
        this.onSelectionChanged({ selectedRowKeys: event.component.getSelectedRowKeys() });
    }

    onSelectionChanged(event) {
        this.buttons[this.NEXT_BTN_INDEX].disabled = !event.selectedRowKeys.length;
    }

    get submitButtonDisabled() {
        return !this.dontSendEmailNotification && !this.cfoService.isMainInstanceType && !this.emailIsValid;
    }

    onInitialized(event) {
        setTimeout(() => {
            event.component.repaint();
        }, 300);
    }
}
