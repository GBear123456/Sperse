/** Core imports */
import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

/** Third party imports */
import moment from 'moment-timezone';
import * as _ from 'underscore';
import { NotifyService } from 'abp-ng2-module/dist/src/notify/notify.service';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import { first, switchMap, tap } from 'rxjs/operators';
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
  providers: [ ReportsServiceProxy ]
})
export class GenerateReportDialogComponent implements OnInit {
    @ViewChild(DxDataGridComponent) dataGrid: DxDataGridComponent;
    @ViewChild(ModalDialogComponent) modalDialog: ModalDialogComponent;

    title = this.ls.l('SelectBusinessEntity');
    buttons: IDialogButton[];
    currentStep = GenerateReportStep.Step1;
    generateReportSteps = GenerateReportStep;

    selectedBusinessEntityIds: any = [];

    dateFrom = moment().subtract(1, 'month').startOf('month');
    dateTo = moment().subtract(1, 'month').endOf('month');
    calendarData = {
        from: { value: DateHelper.addTimezoneOffset(this.dateFrom.toDate(), true) },
        to: { value: DateHelper.addTimezoneOffset(this.dateTo.toDate(), true) },
        options: { }
    };

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
        this.buttons = [
            {
                title: this.ls.l('Cancel'),
                class: 'default',
                action: () => {
                    this.modalDialog.close(true);
                }
            },
            {
                id: 'next',
                title: this.ls.l('Next'),
                class: 'primary saveButton',
                action: this.next.bind(this)
            }
        ];

        this.bankAccountsService.load();
    }

    next() {
        this.applyBusinesEntity();

        this.currentStep++;

        this.title = this.ls.l('SelectDateRange');
        let button = _.findWhere(this.buttons, { id: 'next' });
        button.title = this.ls.l('Generate');
        button.action = this.generateReport.bind(this);
    }

    applyBusinesEntity() {
        this.dataGrid.instance.getSelectedRowKeys().forEach((item) => {
            this.selectedBusinessEntityIds.push(item.id);
        });
    }

    generateReport() {
        this.applyDateRange();
        this.store$.pipe(
            select(CurrenciesStoreSelectors.getSelectedCurrencyId),
            first(),
            tap(() => this.notify.info(this.ls.l('GeneratingStarted'))),
            switchMap(currencyId =>
                this.reportsProxy.generate(<any>this.data.instanceType, this.data.instanceId, new GenerateInput({
                    from: this.dateFrom,
                    to: this.dateTo,
                    period: this.data.period,
                    currencyId,
                    businessEntityIds: this.selectedBusinessEntityIds,
                    bankAccountIds: []
                }))
            )
        ).subscribe(() => {
            this.data.reportGenerated();
            this.notify.info(this.ls.l('SuccessfullyGenerated'));
        });
        this.modalDialog.close(true);
    }

    applyDateRange() {
        let dateFrom = this.calendarData.from.value && DateHelper.removeTimezoneOffset(this.calendarData.from.value, true, 'from');
        let dateTo = this.calendarData.to.value && DateHelper.removeTimezoneOffset(this.calendarData.to.value, true, 'to');
        if ((this.dateTo ? this.dateTo.diff(dateTo, 'days') : dateTo) ||
            (this.dateFrom ? this.dateFrom.diff(dateFrom, 'days') : dateFrom)
        ) {
            this.dateFrom = dateFrom && moment(dateFrom);
            this.dateTo = dateTo && moment(dateTo);
        }
    }
}
