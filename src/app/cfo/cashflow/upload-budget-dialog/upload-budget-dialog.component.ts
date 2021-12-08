/** Core imports */
import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

/** Third party imports */
import { NotifyService } from 'abp-ng2-module/dist/src/notify/notify.service';
import { DxTreeListComponent } from 'devextreme-angular/ui/tree-list';
import { FileSystemFileEntry, NgxFileDropEntry } from 'ngx-file-drop';
import { map, finalize, first } from 'rxjs/operators';

/** Application imports */
import { StringHelper } from '@shared/helpers/StringHelper';
import { IDialogButton } from '@root/shared/common/dialogs/modal/dialog-button.interface';
import { ModalDialogComponent } from '@root/shared/common/dialogs/modal/modal-dialog.component';
import { BankAccountsService } from '@root/shared/cfo/bank-accounts/helpers/bank-accounts.service';
import {
    BudgetImportInput,
    BudgetServiceProxy,
    InstanceServiceProxy,
    InvoiceSettings,
    InstanceType
} from '@root/shared/service-proxies/service-proxies';
import { UserPreferencesService } from '@app/cfo/cashflow/preferences-dialog/preferences.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { UploadBudgetStep } from './upload-budget-step.enum';
import { AppConsts } from '@shared/AppConsts';

@Component({
    templateUrl: 'upload-budget-dialog.component.html',
    styleUrls: [
        'upload-budget-dialog.component.less'
    ],
    providers: [ BudgetServiceProxy ]
})
export class UploadBudgetDialogComponent implements OnInit {
    @ViewChild(DxTreeListComponent) treeList: DxTreeListComponent;
    @ViewChild(ModalDialogComponent) modalDialog: ModalDialogComponent;

    files = [];
    file: string;
    uploadedCount = 0;
    totalCount    = 0;

    overrideAccounts = false;
    selectedYear = new Date();
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
    currentStep = UploadBudgetStep.BusinessEntities;
    uploadBudgetSteps = UploadBudgetStep;
    selectedBusinessEntityIds: any = [];
    selectedBusinessEntities$ = this.bankAccountsService.businessEntities$.pipe(
        map(entities => entities.filter(item => this.selectedBusinessEntityIds.indexOf(item.id) >= 0))
    );

    private readonly BACK_BTN_INDEX = 0;
    private readonly NEXT_BTN_INDEX = 1;
    private uploadSubscribers = [];
    currencyId = 'USD';

    constructor(
        @Inject(MAT_DIALOG_DATA) public data: any,
        private notify: NotifyService,
        private dialogRef: MatDialogRef<UploadBudgetDialogComponent>,
        private instanceAppService: InstanceServiceProxy,
        private budgetProxy: BudgetServiceProxy,
        private userPreferencesService: UserPreferencesService,
        public bankAccountsService: BankAccountsService,
        public ls: AppLocalizationService
    ) {
        this.userPreferencesService.userPreferences$.pipe(first()).subscribe(result => {
            this.currencyId = result.localizationAndCurrency.currency;
        });
    }

    ngOnInit() {
        this.bankAccountsService.load();
    }

    get budgetTemplateLink(): string {
        return [
            AppConsts.remoteServiceBaseUrl,
            '/budgettemplate/get?InstanceType=', this.data.instanceType,
            '&CurrencyId=', this.currencyId,
            '&Year=', this.selectedYear.getUTCFullYear(),
            '&businessEntityId=', this.selectedBusinessEntityIds[0]
        ].join('');
    }

    private prev() {
        this.currentStep--;
        this.processStep();
    }

    private next() {
        let isUpload = this.currentStep == UploadBudgetStep.Upload;
        if (!isUpload)
            this.currentStep++;
        this.processStep(isUpload);
    }

    private processStep(processUpload = false) {
        this.buttons = this.initButtons;
        if (this.currentStep == UploadBudgetStep.BusinessEntities) {
            this.title = this.ls.l('SelectBusinessEntity');
            this.buttons[this.NEXT_BTN_INDEX].title = this.ls.l('Next');
            this.buttons[this.NEXT_BTN_INDEX].disabled = false;
            this.buttons[this.BACK_BTN_INDEX].disabled = true;
        } else {
            this.title = this.ls.l('UploadBudgetFor');
            this.buttons[this.NEXT_BTN_INDEX].title = this.ls.l('Upload');
            this.buttons[this.NEXT_BTN_INDEX].disabled = true;
            this.buttons[this.BACK_BTN_INDEX].disabled = false;
            if (processUpload) {
                let progressInterval = setInterval(
                    this.updateUploadProgress.bind(this), 1000
                );
                this.uploadSubscribers.push(
                    this.budgetProxy.import(this.data.instanceType,
                        this.data.instanceId, new BudgetImportInput({
                            year: this.selectedYear.getUTCFullYear(),
                            businessEntityId: this.selectedBusinessEntityIds[0],
                            currencyId: this.currencyId,
                            excelFile: this.file,
                            override: this.overrideAccounts
                        })
                    ).pipe(finalize(() => {
                        this.finishUploading(progressInterval);
                    })).subscribe(() => {
                        this.dialogRef.close(true);
                    })
                );
            } else
                this.applyBusinessEntity();
        }
    }

    onCalendarOptionChanged(event) {
        if (event.name == 'currentDate')
            this.selectedYear = event.value;
    }

    private applyBusinessEntity() {
        this.selectedBusinessEntityIds = this.treeList.instance.getVisibleRows()
            .filter((item) => item.isSelected)
            .map(item => item.key);
    }

    editStep(step: UploadBudgetStep) {
        this.currentStep = step;
        this.processStep();
    }

    fileChangeListener($event) {
        this.uploadFiles($event.target.files);
    }

    fileDropped(dropedFiles: NgxFileDropEntry[]) {
        let files = [];
        dropedFiles.some((item) => {
            (item.fileEntry as FileSystemFileEntry).file((file: File) => {
                if (!files.length && this.getFileTypeByExt(file.name) == 'xlsx') {
                    files.push(file);
                    this.uploadFiles(files);
                }
            });
            return files.length;
        });
    }

    getFileTypeByExt(fileName) {
        return fileName.split('.').pop();
    }

    uploadFiles(files) {
        this.files = [];
        this.uploadedCount = 0;
        this.uploadSubscribers = [];
        this.totalCount = files.length;

        Array.prototype.forEach.call(files, (file, index) => {
            this.files.push({
                type: this.getFileTypeByExt(file.name),
                name: file.name,
                progress: 0
            });
            let fileReader: FileReader = new FileReader();
            fileReader.onloadend = (loadEvent: any) => {
                this.uploadFile({
                    name: file.name,
                    size: StringHelper.getSize(file.size, loadEvent.target.result),
                    fileBase64: StringHelper.getBase64(loadEvent.target.result)
                }, index);
            };
            fileReader.readAsDataURL(file);
        });
    }

    finishUploadProgress() {
        this.files[0].progress = 100;
    }

    updateUploadProgress() {
        let file = this.files[0];
        if (file && file.progress < 95)
            file.progress++;
    }

    uploadFile(input, index) {
        if (AppConsts.regexPatterns.notSupportedDocuments.test(input.name)) {
            this.notify.error(this.ls.l('FileTypeIsNotAllowed'));
            this.updateUploadedCounter();
            return;
        }

        if (input.size > AppConsts.maxDocumentSizeBytes) {
            this.notify.error(this.ls.l('FilesizeLimitWarn', AppConsts.maxDocumentSizeMB));
            this.updateUploadedCounter();
            return;
        }

        this.file = input.fileBase64;
        this.buttons[this.NEXT_BTN_INDEX].disabled = false;
    }

    finishUploading(progressInterval) {
        clearInterval(progressInterval);
        this.finishUploadProgress();
        this.updateUploadedCounter();
    }

    updateUploadedCounter() {
        this.uploadedCount++;
        if (this.uploadedCount >= this.totalCount) {
            this.totalCount = 0;
            this.uploadedCount = 0;
        }
    }

    cancelUpload(index = 0) {
        let file = this.files[index];
        if (file && file.progress < 100) {
            if (this.uploadSubscribers[index]) {
                this.uploadSubscribers[index].unsubscribe();
                this.uploadSubscribers.splice(index, 1);
            }
            this.files.splice(index, 1);
            this.totalCount = this.files.length;
            this.buttons[this.NEXT_BTN_INDEX].disabled = true;
        }
    }

    onSelectionChanged(event) {
        if (event.selectedRowKeys.length != 1)
            event.component.selectRows(event.currentDeselectedRowKeys.concat(event.currentSelectedRowKeys));
        if (this.currentStep == UploadBudgetStep.BusinessEntities)
            this.buttons[this.NEXT_BTN_INDEX].disabled = false;
    }
}