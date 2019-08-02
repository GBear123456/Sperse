/** Core imports */
import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

/** Third party imports */
import moment from 'moment-timezone';
import * as _ from 'underscore';
import { NotifyService } from 'abp-ng2-module/dist/src/notify/notify.service';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import { first, switchMap, tap, map } from 'rxjs/operators';
import { from, forkJoin } from 'rxjs';
import { select, Store } from '@ngrx/store';

/** Application imports */
import { DateHelper } from '@shared/helpers/DateHelper';
import { IDialogButton } from '@root/shared/common/dialogs/modal/dialog-button.interface';
import { ModalDialogComponent } from '@root/shared/common/dialogs/modal/modal-dialog.component';
import { BankAccountsService } from '@root/shared/cfo/bank-accounts/helpers/bank-accounts.service';
import { ReportsServiceProxy, GenerateInput } from '@root/shared/service-proxies/service-proxies';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { GenerateReportStep } from './generate-report-step.enum';
import { CfoStore, CurrenciesStoreSelectors } from '@app/cfo/store';

@Component({
    templateUrl: 'generate-report-dialog.component.html',
    styleUrls: ['generate-report-dialog.component.less'],
    providers: [ReportsServiceProxy]
})
export class GenerateReportDialogComponent implements OnInit {
    @ViewChild(DxDataGridComponent) dataGrid: DxDataGridComponent;
    @ViewChild(ModalDialogComponent) modalDialog: ModalDialogComponent;

    title = this.ls.l('SelectBusinessEntity');
    initButtons: IDialogButton[];
    buttons: IDialogButton[];
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

    private readonly BACK_BTN_INDEX = 0;
    private readonly NEXT_BTN_INDEX = 1;

    constructor(
        @Inject(MAT_DIALOG_DATA) public data: any,
        public reportsProxy: ReportsServiceProxy,
        public bankAccountsService: BankAccountsService,
        public dialogRef: MatDialogRef<GenerateReportDialogComponent, any>,
        public ls: AppLocalizationService,
        public notify: NotifyService,
        private store$: Store<CfoStore.State>
    ) {
        this.dialogRef['_overlayRef'].hostElement.classList.add('generate-report');
    }

    ngOnInit() {
        this.initButtons = [
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
        this.buttons = this.initButtons;
        this.bankAccountsService.load();
    }

    prev() {
        this.currentStep--;
        this.processStep();
    }

    next() {
        this.currentStep++;
        if (this.currentStep == GenerateReportStep.Step2) {
            this.applyBusinessEntity();
        }
        if (this.currentStep == GenerateReportStep.Step3) {
            this.applyDateRange();
        }
        this.processStep();
    }

    processStep() {
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
            this.buttons = null;
        }
    }

    editDate() {
        this.currentStep = GenerateReportStep.Step2;
        this.processStep();
    }

    editBusinessEntities() {
        this.currentStep = GenerateReportStep.Step1;
        this.processStep();
    }

    applyBusinessEntity() {
        this.bankAccountsService.changeSelectedBusinessEntities(
            this.selectedBusinessEntityIds = this.dataGrid.instance.getSelectedRowKeys()
        );
    }

    generateReport() {
        this.modalDialog.startLoading();
        this.store$.pipe(
            select(CurrenciesStoreSelectors.getSelectedCurrencyId),
            first(),
            tap(() => this.notify.info(this.ls.l('GeneratingStarted'))),
            switchMap(currencyId => {
                let genOb = this.isSeparateGrouping ? this.selectedBusinessEntityIds.map(param =>
                    this.reportsProxy.generate(<any>this.data.instanceType, this.data.instanceId, new GenerateInput({
                        from: this.dateFrom && DateHelper.getDateWithoutTime(this.dateFrom),
                        to: this.dateTo && DateHelper.getDateWithoutTime(this.dateTo),
                        period: this.data.period,
                        currencyId,
                        businessEntityIds: [Number(param)],
                        bankAccountIds: []
                    }))) :
                    this.reportsProxy.generate(<any>this.data.instanceType, this.data.instanceId, new GenerateInput({
                        from: this.dateFrom && DateHelper.getDateWithoutTime(this.dateFrom),
                        to: this.dateTo && DateHelper.getDateWithoutTime(this.dateTo),
                        period: this.data.period,
                        currencyId,
                        businessEntityIds: this.selectedBusinessEntityIds,
                        bankAccountIds: []
                    }));
                return forkJoin(genOb);
            })
        ).subscribe(() => {
            this.modalDialog.finishLoading();
            this.data.reportGenerated();
            this.modalDialog.close(true);
            this.notify.info(this.ls.l('SuccessfullyGenerated'));
        });
    }

    applyDateRange() {
        let dateFrom = this.calendarData.from.value && DateHelper.removeTimezoneOffset(this.calendarData.from.value);
        let dateTo = this.calendarData.to.value ? DateHelper.removeTimezoneOffset(this.calendarData.to.value) : dateFrom;
        if ((this.dateTo ? this.dateTo.diff(dateTo, 'days') : dateTo) ||
            (this.dateFrom ? this.dateFrom.diff(dateFrom, 'days') : dateFrom)
        ) {
            this.dateFrom = dateFrom && moment(dateFrom);
            this.dateTo = dateTo && moment(dateTo);
        }
    }

    onContentReady(event) {
        this.onSelectionChanged({ selectedRowKeys: event.component.getSelectedRowKeys() });
    }

    onSelectionChanged(event) {
        this.buttons[this.NEXT_BTN_INDEX].disabled = !event.selectedRowKeys.length;
    }

    onInitialized(event) {
        setTimeout(() => {
            event.component.repaint();
        }, 300);
    }
}
