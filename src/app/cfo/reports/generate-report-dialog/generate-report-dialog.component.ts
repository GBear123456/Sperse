/** Core imports */
import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

/** Third party imports */
import moment from 'moment-timezone';
import { NotifyService } from 'abp-ng2-module/dist/src/notify/notify.service';
import { DxTreeListComponent } from 'devextreme-angular/ui/tree-list';
import { DxTextBoxComponent } from 'devextreme-angular';
import { forkJoin, Observable } from 'rxjs';
import { first, switchMap, tap, map, finalize } from 'rxjs/operators';
import { select, Store } from '@ngrx/store';

/** Application imports */
import { DateHelper } from '@shared/helpers/DateHelper';
import { IDialogButton } from '@root/shared/common/dialogs/modal/dialog-button.interface';
import { ModalDialogComponent } from '@root/shared/common/dialogs/modal/modal-dialog.component';
import { BankAccountsService } from '@root/shared/cfo/bank-accounts/helpers/bank-accounts.service';
import {
    BudgetServiceProxy,
    SendReportNotificationInfo,
    GenerateBudgetReportInput,
    DepartmentsServiceProxy,
    ReportsServiceProxy,
    GenerateInput,
    GenerateBalanceSheetReportInput,
    InstanceServiceProxy,
    InstanceType,
    ReportTemplate,
    GenerateIncomeStatementByEntityReportInput
} from '@root/shared/service-proxies/service-proxies';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { GenerateReportStep } from './generate-report-step.enum';
import { RootStore, CurrenciesStoreSelectors } from '@root/store';
import { CFOService } from '@shared/cfo/cfo.service';
import { AppConsts } from '@shared/AppConsts';
import { FeatureCheckerService } from '@abp/features/feature-checker.service';
import { AppFeatures } from '@shared/AppFeatures';
import { ReportType } from '../enums/reportType.enum';
import { GenerateReportItem } from './generate-report-item';
import { ReportPeriod } from '../enums/reportPeriod.enum';

@Component({
    templateUrl: 'generate-report-dialog.component.html',
    styleUrls: [
        '../report-dialog.less',
        'generate-report-dialog.component.less'
    ],
    providers: [DepartmentsServiceProxy, ReportsServiceProxy, BudgetServiceProxy]
})
export class GenerateReportDialogComponent implements OnInit {
    @ViewChild('beTreeList') beTreeList: DxTreeListComponent;
    @ViewChild('templatesTreeList') templatesTreeList: DxTreeListComponent;
    @ViewChild(ModalDialogComponent) modalDialog: ModalDialogComponent;
    @ViewChild('notificationToEmailTextBox') notificationToEmailTextBox: DxTextBoxComponent;

    title = this.ls.l('SelectReportTemplate');
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
            disabled: false
        }
    ];
    templateConfig = {
        default: {
            showDepartments: true,
            showYearCalendar: false,
            allowMultipleBE: true,
            showSingleDateCalendar: false,
            generateMethod: this.getDefaultReportRequest.bind(this),
            reportPeriod: null
        },
        Budget: {
            showYearCalendar: true,
            generateMethod: this.getBudgetReportRequest.bind(this),
            reportPeriod: ReportPeriod.Annual
        },
        BalanceSheet: {
            allowMultipleBE: true,
            showSingleDateCalendar: true,
            generateMethod: this.getBalanceSheetReportRequest.bind(this)
        },
        IncomeStatementByEntity: {
            allowMultipleBE: true,
            generateMethod: this.getIncomeStatementByEntityRequest.bind(this)
        }
    };
    currentConfig = this.templateConfig.default;
    budgetReportDate: Date = DateHelper.addTimezoneOffset(new Date(), true);
    departmentsEntities: string[] = [];
    selectedDepartments: string[] = [];
    noDepartmentItem = this.ls.l('NoDepartment');
    buttons: IDialogButton[] = this.initButtons;
    currentStep = GenerateReportStep.ReportTemplate;
    generateReportSteps = GenerateReportStep;
    selectedBusinessEntityIds: any = [];
    selectedBusinessEntities$ = this.bankAccountsService.businessEntities$.pipe(
        map(entities => entities.filter(item => this.selectedBusinessEntityIds.indexOf(item.id) >= 0))
    );
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
    isSeparateGrouping = false;
    notificationToEmail: string;
    emailRegEx = AppConsts.regexPatterns.email;
    sendEmailNotification = true;
    sendReportInAttachments = false;
    generatingStarted = false;

    reportTemplateItems: GenerateReportItem[] = [];
    selectedReportTemplate: GenerateReportItem;
    firstReportTemplateVisit = true;

    private readonly BACK_BTN_INDEX = 0;
    private readonly NEXT_BTN_INDEX = 1;

    constructor(
        @Inject(MAT_DIALOG_DATA) public data: any,
        private departmentsProxy: DepartmentsServiceProxy,
        private reportsProxy: ReportsServiceProxy,
        private notify: NotifyService,
        private store$: Store<RootStore.State>,
        private dialogRef: MatDialogRef<GenerateReportDialogComponent>,
        private instanceAppService: InstanceServiceProxy,
        private feature: FeatureCheckerService,
        private budgetProxy: BudgetServiceProxy,
        public cfoService: CFOService,
        public bankAccountsService: BankAccountsService,
        public ls: AppLocalizationService
    ) {
        this.dialogRef['_overlayRef'].hostElement.classList.add('generate-report');
        if (feature.isEnabled(AppFeatures.CFODepartmentsManagement))
            this.departmentsProxy.getAccessibleDepartments(this.cfoService.instanceType,
                this.cfoService.instanceId).subscribe(res => {
                    this.departmentsEntities = [this.noDepartmentItem].concat(res);
                });
        this.intiReportTemplateItems();
    }

    ngOnInit() {
        this.instanceAppService.getInstanceOwnerEmailAddress(
            this.cfoService.instanceType as InstanceType,
            this.cfoService.instanceId
        ).subscribe((ownerEmail: string) => {
            this.notificationToEmail = ownerEmail.length ? ownerEmail : undefined;
        });
        this.bankAccountsService.load();
    }

    intiReportTemplateItems() {
        this.reportTemplateItems.push(
            {
                id: ReportType.BalanceSheet,
                text: this.ls.l('ReportTypes_' + ReportType.BalanceSheet),
                type: ReportType.BalanceSheet,
                fileType: 'pdf'
            },
            {
                id: ReportType.Budget,
                text: this.ls.l('ReportTypes_' + ReportType.Budget),
                type: ReportType.Budget,
                fileType: 'pdf',
                hidden: !this.feature.isEnabled(AppFeatures.CFOBudgets)
            },
            {
                id: ReportType.IncomeStatement,
                text: this.ls.l('ReportTypes_' + ReportType.IncomeStatement),
                type: ReportType.IncomeStatement,
                fileType: 'pdf',
                isReadOnly: true,
                items: this.getReportTypeTemplateItems(ReportType.IncomeStatement)
            },
            {
                id: ReportType.IncomeStatementByEntity,
                text: this.ls.l('ReportTypes_' + ReportType.IncomeStatementByEntity),
                type: ReportType.IncomeStatementByEntity,
                fileType: 'excel',
                isReadOnly: true,
                items: this.getReportTypeTemplateItems(ReportType.IncomeStatementByEntity)
            }
        );

        this.selectedReportTemplate = this.reportTemplateItems.find(v => !v.isReadOnly);
        this.currentConfig = this.templateConfig[this.selectedReportTemplate.type] ? this.templateConfig[this.selectedReportTemplate.type] : this.templateConfig.default;
    }

    private getReportTypeTemplateItems(type: ReportType): GenerateReportItem[] {
        return Object.keys(ReportTemplate).map(item => {
            return {
                id: type + item,
                text: this.ls.l('ReportTemplates_' + item),
                type: type,
                template: ReportTemplate[item],
                isSelectable: true
            };
        })
    }

    /**
     * Return GenerateInput
     * @param {string} currencyId
     * @param {number[]} businessEntityIds
     * @param {string[]} departments
     * @return {GenerateInput}
     */
    private getGenerateInput(currencyId: string, businessEntityIds: number[], departments: string[]): GenerateInput {
        return new GenerateInput({
            reportTemplate: this.selectedReportTemplate.template,
            from: this.dateFrom && DateHelper.getDateWithoutTime(this.dateFrom),
            to: this.dateTo && DateHelper.getDateWithoutTime(this.dateTo),
            currencyId,
            departments: departments.map(item => item == this.noDepartmentItem ? null : item),
            businessEntityIds: businessEntityIds,
            bankAccountIds: [],
            notificationData: this.getNotificationData()
        });
    }

    applyDateRange() {
        let dateFrom = this.calendarData.from.value && DateHelper.removeTimezoneOffset(new Date(this.calendarData.from.value));
        let dateTo = this.calendarData.to.value ? DateHelper.removeTimezoneOffset(new Date(this.calendarData.to.value)) : dateFrom;
        if ((this.dateTo ? this.dateTo.diff(dateTo, 'days') : dateTo) ||
            (this.dateFrom ? this.dateFrom.diff(dateFrom, 'days') : dateFrom)
        ) {
            this.dateFrom = dateFrom && moment(dateFrom);
            this.dateTo = dateTo && moment(dateTo);
        }
    }

    private prev() {
        this.currentStep--;
        if (this.currentStep == GenerateReportStep.Departments
            && (!this.currentConfig.showDepartments || this.departmentsEntities.length <= 1)
        ) this.currentStep--;
        this.processStep();
    }

    private next() {
        this.currentStep++;
        if (this.currentStep == GenerateReportStep.Calendar) {
            this.applyBusinessEntity();
            if (this.firstReportTemplateVisit && this.selectedReportTemplate.type == ReportType.IncomeStatement && this.selectedReportTemplate.template == ReportTemplate.Suspense) {
                this.setSuspenseReportDates();
                this.firstReportTemplateVisit = false;
            }
        } else if (this.currentStep == GenerateReportStep.Departments) {
            if (this.departmentsEntities.length <= 1 || !this.currentConfig.showDepartments)
                this.currentStep++;
        } else if (this.currentStep == GenerateReportStep.Final) {
            this.applyDateRange();
        }
        this.processStep();
    }

    private processStep() {
        this.buttons = this.initButtons;
        if (this.currentStep == GenerateReportStep.BusinessEntities) {
            this.selectedBusinessEntityIds = [];
            this.title = this.ls.l('SelectBusinessEntity');
            this.buttons[this.NEXT_BTN_INDEX].disabled = true;
            this.buttons[this.BACK_BTN_INDEX].disabled = false;
        } else if (this.currentStep == GenerateReportStep.Departments) {
            this.title = this.ls.l('SelectDepartments');
            this.buttons[this.NEXT_BTN_INDEX].disabled = false;
            this.buttons[this.BACK_BTN_INDEX].disabled = false;
        } else if (this.currentStep == GenerateReportStep.ReportTemplate) {
            this.title = this.ls.l('SelectReportTemplate');
            this.buttons[this.NEXT_BTN_INDEX].disabled = false;
            this.buttons[this.BACK_BTN_INDEX].disabled = true;
        } else if (this.currentStep == GenerateReportStep.Calendar) {
            this.title = this.currentConfig.showYearCalendar ? this.ls.l('Select') + ' ' + this.ls.l('Year') :
                this.ls.l(this.currentConfig.showSingleDateCalendar ? 'SelectDate' : 'SelectDateRange');
            this.buttons[this.BACK_BTN_INDEX].disabled = false;
            this.buttons[this.NEXT_BTN_INDEX].disabled = false;
        } else if (this.currentStep == GenerateReportStep.Final) {
            this.title = this.ls.l('ReportGenerationOptions');
            this.buttons = null;
        }
    }

    private setSuspenseReportDates() {
        let todayDay = new Date().getDate();
        if (todayDay >= 16) { // from 1 to 15 of current month
            this.dateFrom = moment.utc().startOf('month');
            this.dateTo = moment.utc().set('date', 15);
        } else { // from 16 to end of previous month
            this.dateFrom = moment.utc().subtract(1, 'month').set('date', 16);
            this.dateTo = moment.utc().subtract(1, 'month').endOf('month');
        }

        this.calendarData.from.value = DateHelper.addTimezoneOffset(this.dateFrom.toDate());
        this.calendarData.to.value = DateHelper.addTimezoneOffset(this.dateTo.toDate());
    }

    private applyBusinessEntity() {
        this.selectedBusinessEntityIds = this.beTreeList.instance.getVisibleRows()
            .filter((item) => item.isSelected)
            .map(item => item.key);
    }

    get emailIsValidAndNotEmpty(): boolean {
        return this.notificationToEmail && this.notificationToEmailTextBox && this.notificationToEmailTextBox.instance.option('isValid');
    }

    get emailIsValid(): boolean {
        return this.notificationToEmailTextBox && this.notificationToEmailTextBox.instance && this.notificationToEmailTextBox.instance.option('isValid');
    }

    editStep(step: GenerateReportStep) {
        this.currentStep = step;
        this.processStep();
    }

    onTemplateRadioButtonClick(event, item: GenerateReportItem) {
        if (event.value) {
            this.selectedReportTemplate = item;
            this.currentConfig = this.templateConfig[item.type] ? this.templateConfig[item.type] : this.templateConfig.default;
        }
    }

    generateReport() {
        if (this.submitButtonDisabled)
            return;

        this.generatingStarted = true;
        this.store$.pipe(
            select(CurrenciesStoreSelectors.getSelectedCurrencyId),
            first(),
            tap(() => this.notify.info(this.ls.l('GeneratingStarted'))),
            switchMap((currencyId: string) => this.currentConfig.generateMethod(currencyId))
        ).pipe(
            finalize(() => {
                this.generatingStarted = false;
            })
        ).subscribe(
            () => {
                this.data.reportGenerated(this.currentConfig.reportPeriod);
                this.modalDialog.close(true);
                this.notify.info(this.ls.l('SuccessfullyGenerated'));
            },
            () => {
                this.notify.error(this.ls.l('GenerationFailed'));
            }
        );
    }

    getDefaultReportRequest(currencyId: string) {
        if (this.isSeparateGrouping) {
            let observables: Observable<void>[] = [];
            this.selectedBusinessEntityIds.map(param => {
                if (this.departmentsEntities.length) {
                    let departments = this.selectedDepartments.length ? this.selectedDepartments : this.departmentsEntities;
                    departments.forEach(dept => {
                        observables.push(this.reportsProxy.generate(
                            <any>this.data.instanceType,
                            this.data.instanceId,
                            this.getGenerateInput(currencyId, [+param], [dept])
                        ));
                    });
                } else {
                    observables.push(this.reportsProxy.generate(
                        <any>this.data.instanceType,
                        this.data.instanceId,
                        this.getGenerateInput(currencyId, [+param], this.selectedDepartments)
                    ));
                }
            });

            return forkJoin(observables);
        } else {
            return this.reportsProxy.generate(
                <any>this.data.instanceType,
                this.data.instanceId,
                this.getGenerateInput(currencyId, this.selectedBusinessEntityIds, this.selectedDepartments)
            );
        }
    }

    getBudgetReportRequest(currencyId: string) {
        return this.budgetProxy.generateReport(<any>this.data.instanceType, this.data.instanceId,
            new GenerateBudgetReportInput({
                businessEntityId: this.selectedBusinessEntityIds[0],
                year: this.budgetReportDate.getUTCFullYear(),
                currencyId: currencyId,
                notificationData: this.getNotificationData()

            }));
    }

    getBalanceSheetReportRequest(currencyId: string) {
        return this.reportsProxy.generateBalanceSheetReport(<any>this.data.instanceType, this.data.instanceId,
            new GenerateBalanceSheetReportInput({
                businessEntityIds: this.selectedBusinessEntityIds,
                date: this.dateTo && DateHelper.getDateWithoutTime(this.dateTo),
                currencyId: currencyId,
                notificationData: this.getNotificationData()
            }));
    }

    getIncomeStatementByEntityRequest(currencyId: string) {
        return this.reportsProxy.generateIncomeStatementByEntityReport(<any>this.data.instanceType, this.data.instanceId,
            new GenerateIncomeStatementByEntityReportInput({
                reportTemplate: this.selectedReportTemplate.template,
                businessEntityIds: this.selectedBusinessEntityIds,
                from: this.dateFrom && DateHelper.getDateWithoutTime(this.dateFrom),
                to: this.dateTo && DateHelper.getDateWithoutTime(this.dateTo),
                currencyId: currencyId,
                notificationData: this.getNotificationData()
            }));
    }

    getNotificationData(): SendReportNotificationInfo {
        return this.sendEmailNotification && this.emailIsValidAndNotEmpty
            ? new SendReportNotificationInfo({
                recipientUserEmailAddress: this.notificationToEmail,
                sendReportInAttachments: this.sendReportInAttachments
            }) : null;
    }

    onReportTemplateRowPrepared(event) {
        let data: GenerateReportItem = event.data;
        if (event.level == 0) {
            if (data.isReadOnly)
                event.rowElement.classList.add('readonly-parent');
            else
                event.rowElement.classList.add('selectable-parent');
        }
        if (event.level == 1) {
            event.rowElement.classList.add('selectable-child');
        }
    }

    onReportTemplateRowClick(rowItem) {
        if (rowItem.row.isExpanded) {
            rowItem.component.collapseRow(rowItem.row.key);
        }
        else {
            rowItem.component.expandRow(rowItem.row.key);
        }
    }

    onBEContentReady(event) {
        this.onBESelectionChanged({ selectedRowKeys: event.component.getSelectedRowKeys() });
    }

    onBESelectionChanged(event) {
        let currentKeys = !event.currentDeselectedRowKeys ? [] :
            event.currentDeselectedRowKeys.concat(event.currentSelectedRowKeys);
        if (!this.currentConfig.allowMultipleBE && event.selectedRowKeys.length != 1 && event.component)
            event.component.selectRows(currentKeys);

        if (this.currentStep === GenerateReportStep.BusinessEntities) {
            this.buttons[this.NEXT_BTN_INDEX].disabled = !(this.currentConfig.allowMultipleBE ||
                !event.currentSelectedRowKeys ? event.selectedRowKeys : currentKeys).length;
        }
    }

    onBERowClick(event) {
        if (event.isSelected)
            event.component.deselectRows([event.key]);
        else
            event.component.selectRows([event.key]);
    }

    onBECellClick(event) {
        if (event.rowType == 'header' && event.event.target.innerText == this.ls.l('SelectAll')) {
            let component = event.component;
            if (component.getSelectedRowKeys('all').length == component.getDataSource().items().length)
                component.deselectAll();
            else
                component.selectAll();
        }
    }

    get submitButtonDisabled() {
        return this.generatingStarted || this.sendEmailNotification && !this.emailIsValidAndNotEmpty;
    }

    onCalendarOptionChanged(event) {
        if (event.name == 'currentDate')
            this.budgetReportDate = event.value;
    }

    onInitialized(event) {
        setTimeout(() => {
            event.component.repaint();
        }, 300);
    }

    getImageSrc(type: string): string {
        switch (type) {
            case 'pdf': return './assets/common/icons/pdf.svg';
            case 'excel': return './assets/common/icons/xls.svg';
        }
    }
}