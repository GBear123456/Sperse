/** Core imports */
import { Component, ChangeDetectionStrategy, OnInit, ViewChild, Inject } from '@angular/core';

/** Third party imports */
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { DxContextMenuComponent } from 'devextreme-angular/ui/context-menu';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import { DxSelectBoxComponent } from 'devextreme-angular/ui/select-box';
import { CacheService } from 'ng2-cache-service';
import { finalize } from 'rxjs/operators';

/** Application imports */
import { DialogService } from '@app/shared/common/dialogs/dialog.service';
import { AppConsts } from '@shared/AppConsts';
import { InvoiceServiceProxy, CreateInvoiceInput, UpdateInvoiceLineInput, UpdateInvoiceStatusInput,
    UpdateInvoiceInput, CustomerServiceProxy, CreateInvoiceInputStatus, UpdateInvoiceInputStatus,
    UpdateInvoiceStatusInputStatus, CreateInvoiceLineInput } from '@shared/service-proxies/service-proxies';
import { NotifyService } from '@abp/notify/notify.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { CacheHelper } from '@shared/common/cache-helper/cache-helper';
import { MessageService } from '@abp/message/message.service';
import { LoadingService } from '@shared/common/loading-service/loading.service';
import { IDialogButton } from '@shared/common/dialogs/modal/dialog-button.interface';

@Component({
    templateUrl: 'create-invoice-dialog.component.html',
    styleUrls: [ '../../../shared/form.less', 'create-invoice-dialog.component.less' ],
    providers: [ DialogService, InvoiceServiceProxy, CustomerServiceProxy ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreateInvoiceDialogComponent implements OnInit {
    @ViewChild(DxContextMenuComponent) saveContextComponent: DxContextMenuComponent;
    @ViewChild(DxDataGridComponent) linesComponent: DxDataGridComponent;
    @ViewChild('contact') contactComponent: DxSelectBoxComponent;

    private lookupTimeout;
    private readonly SAVE_OPTION_DEFAULT = 1;
    private readonly SAVE_OPTION_CACHE_KEY = 'save_option_active_index';

    invoiceId: number;
    statuses: any[] = [];
    status = CreateInvoiceInputStatus.Draft;

    saveButtonId = 'saveInvoiceOptions';
    saveContextMenuItems = [];

    customer: any;
    contactId: number;
    customers = [];

    currentDate = new Date();
    date = this.currentDate;
    dueDate = this.date;

    order: any;
    description = '';
    notes = '';
    lines = [];

    toolbarConfig = [];
    disabledForUpdate = false;
    editTitle = !this.disabledForUpdate;
    buttons: IDialogButton[] = [
        {
            id: this.saveButtonId,
            title: this.ls.l('Save'),
            class: 'primary menu',
            action: this.save.bind(this)
        }
    ];

    constructor(
        private _invoiceProxy: InvoiceServiceProxy,
        private _customerProxy: CustomerServiceProxy,
        private _cacheService: CacheService,
        private _notifyService: NotifyService,
        private _messageService: MessageService,
        private _cacheHelper: CacheHelper,
        private _loadingService: LoadingService,
        private _dialogRef: MatDialogRef<CreateInvoiceDialogComponent>,
        public dialog: MatDialog,
        public ls: AppLocalizationService,
        @Inject(MAT_DIALOG_DATA) private data: any
    ) {
        this.ls.localizationSourceName = AppConsts.localization.CRMLocalizationSourceName;
        this.saveContextMenuItems = [
            {text: this.ls.l('SaveAndAddNew'), selected: false},
            {text: this.ls.l('SaveAndClose'), selected: false}
        ];

        this._customerProxy.getAllByPhrase('', 10).subscribe((res) => {
            this.customers = res;
        });

        this.initInvoiceData();
        this.initToolbarConfig();
    }

    ngOnInit() {
        this.saveOptionsInit();
    }

    initInvoiceData() {
        let invoice = this.data.invoice;
        if (invoice) {
            this.invoiceId = invoice.Id;
            this.data.title = invoice.Number;
            this.status = invoice.Status;
            this.date = invoice.Date;
            this.dueDate = invoice.DueDate;
            this.contactId = invoice.ContactId;
            this.disabledForUpdate = this.status != CreateInvoiceInputStatus.Draft
                && this.status != CreateInvoiceInputStatus.Final;

            this._invoiceProxy.getInvoiceInfo(invoice.Id).subscribe((res) => {
                this.description = res.description;
                this.notes = res.note;
                this.customer = res.contactName;
                this.lines = res.lines.map((res) => {
                    return {
                        id: res.id,
                        Quantity: res.quantity,
                        Rate: res.rate,
                        Description: res.description
                    };
                });
            });
        }
    }

    initToolbarConfig() {
        this.toolbarConfig = [
            {
                location: 'after',
                locateInMenu: 'auto',
                items: [
                    {
                        name: 'status',
                        widget: 'dxSelectBox',
                        disabled: false,
                        options: {
                            hint: 'Status',
                            value: this.status,
                            valueExpr: 'text',
                            displayExpr: 'text',
                            items: Object.keys(CreateInvoiceInputStatus).map((item) => {
                                return {
                                    text: item,
                                    disabled: (item == CreateInvoiceInputStatus.Paid
                                        || item == CreateInvoiceInputStatus.Canceled)
                                        && (!this.data.invoice || this.data.invoice.Status != CreateInvoiceInputStatus.Sent)
                                };
                            }),
                            onValueChanged: (event) => {
                                this.status = event.value;
                            }
                        }
                    }
                ]
            },
            {
                location: 'after',
                locateInMenu: 'auto',
                areItemsDependent: true,
                items: [
                    {
                        name: 'delete',
                        visible: Boolean(this.data.invoice),
                        disabled: !this.data.invoice ||
                            (this.data.invoice.Status == CreateInvoiceInputStatus.Paid),
                        action: this.deleteInvoice.bind(this)
                    }
                ]
            },
            {
                location: 'after',
                locateInMenu: 'auto',
                areItemsDependent: true,
                items: [
                    {
                        name: 'discard',
                        visible: !this.data.invoice,
                        action: this.resetFullDialog.bind(this, false)
                    }
                ]
            }
        ];
    }

    saveOptionsInit() {
        let cacheKey = this._cacheHelper.getCacheKey(this.SAVE_OPTION_CACHE_KEY, this.constructor.name),
            selectedIndex = this.SAVE_OPTION_DEFAULT;
        if (this._cacheService.exists(cacheKey))
            selectedIndex = this._cacheService.get(cacheKey);
        this.saveContextMenuItems[selectedIndex].selected = true;
        this.data.buttons[0].title = this.saveContextMenuItems[selectedIndex].text;
    }

    onSaveOptionSelectionChanged($event) {
        let option = $event.addedItems.pop() || $event.removedItems.pop() ||
            this.saveContextMenuItems[this.SAVE_OPTION_DEFAULT];
        option.selected = true;
        $event.component.option('selectedItem', option);

        this.updateSaveOption(option);
        this.save();
    }

    updateSaveOption(option) {
        this.data.buttons[0].title = option.text;
        this._cacheService.set(this._cacheHelper.getCacheKey(this.SAVE_OPTION_CACHE_KEY, this.constructor.name),
            this.saveContextMenuItems.findIndex((elm) => elm.text == option.text).toString());
    }

    private setRequestCommonFields(data) {
        data.date = new Date(this.date);
        data.dueDate = new Date(this.dueDate);
        data.description = this.description;
        data.note = this.notes;
    }

    private createEntity(): void {
        let subscription,
            saveButton: any = document.getElementById(this.saveButtonId);
        if (this.invoiceId) {
            let data = new UpdateInvoiceInput();
            this.setRequestCommonFields(data);
            data.id = this.invoiceId;
            data.status = UpdateInvoiceInputStatus[this.status];
            data.lines = this.lines.map((row, index) => {
                return new UpdateInvoiceLineInput({
                    id: row.id,
                    quantity: row.Quantity,
                    rate: row.Rate,
                    unitId: 'UT',
                    description: row.Description,
                    sortOrder: index
                });
            });
            subscription = this._invoiceProxy.update(data);
        } else {
            let data = new CreateInvoiceInput();
            this.setRequestCommonFields(data);
            data.contactId = this.contactId;
            data.orderId = this.order && this.order.id;
            data.status = CreateInvoiceInputStatus[this.status];
            data.lines = this.lines.map((row, index) => {
                return new CreateInvoiceLineInput({
                    quantity: row.Quantity,
                    rate: row.Rate,
                    unitId: 'UT',
                    description: row.Description,
                    sortOrder: index
                });
            });
            subscription = this._invoiceProxy.create(data);
        }

        saveButton.disabled = true;
        subscription.pipe(finalize(() => {
            saveButton.disabled = false;
        })).subscribe((res) => {
            this.afterSave();
        });
    }

    updateStatus() {
        if (this.status != this.data.invoice.Status)
            this._invoiceProxy.updateStatus(new UpdateInvoiceStatusInput({
                id: this.invoiceId,
                status: UpdateInvoiceStatusInputStatus[this.status]
            })).subscribe((res) => {
                this.afterSave();
            });
    }

    private afterSave(): void {
        if (this.saveContextMenuItems[0].selected)
            this.resetFullDialog();
        else
            this.close();

        this._notifyService.info(this.ls.l('SavedSuccessfully'));
        this.data.refreshParent && this.data.refreshParent();
    }

    save(event?): void {
        if (event && event.offsetX > 140)
            return this.saveContextComponent
                .instance.option('visible', true);

        if (!this.data.title) {
            this.data.isTitleValid = false;
            return this.data.isTitleValid;
        }

        if (isNaN(this.contactId))
            return this.contactComponent.instance.option('isValid', false);

        if (!this.lines.length)
            return this._notifyService.error(this.ls.l('InvoiceLinesShouldBeDefined'));

        if (this.disabledForUpdate)
            this.updateStatus();
        else
            this.createEntity();
    }

    onFieldFocus(event) {
        event.component.option('isValid', true);
    }

    customerLookupItems($event) {
        let search = this.customer = $event.event.target.value;
        if (this.customers.length)
            this.customers = [];

        $event.component.option('opened', true);
        $event.component.option('noDataText', this.ls.l('LookingForItems'));

        clearTimeout(this.lookupTimeout);
        this.lookupTimeout = setTimeout(() => {
            $event.component.option('opened', true);
            $event.component.option('noDataText', this.ls.l('LookingForItems'));

            this._customerProxy.getAllByPhrase(search, 10).subscribe((res) => {
                if (search == this.customer) {
                    if (!res['length'])
                        $event.component.option('noDataText', this.ls.l('NoItemsFound'));

                    this.customers = res;
                }
            });
        }, 500);
    }

    resetFullDialog(forced = true) {
        let resetInternal = () => {
            this.data.title = undefined;
            this.data.isTitleValid = true;
            this.status = CreateInvoiceInputStatus.Draft;
            this.customer = undefined;
            this.date = this.currentDate;
            this.dueDate = this.date;
            this.description = '';
            this.notes = '';
            this.lines = [];

            this.initToolbarConfig();
        };

        if (forced)
            resetInternal();
        else
            this._messageService.confirm(this.ls.l('DiscardConfirmation'), '', (confirmed) => {
                if (confirmed)
                    resetInternal();
            });
    }

    calculateLineAmount(data) {
        return data.Quantity * data.Rate || '';
    }

    calculateSummary(options) {
        if (options.name === 'RowsSummary') {
            if (options.summaryProcess === 'start') {
                options.totalValue = 0;
            } else if (options.summaryProcess === 'calculate') {
                options.totalValue = options.totalValue + (options.value.Quantity * options.value.Rate || 0);
            }
        }
    }

    onToolbarPreparing(event) {
        event.toolbarOptions.items[0].locateInMenu = 'never';
    }

    selectContact(event) {
        this.contactId = event.selectedItem && event.selectedItem.id;
    }

    close() {
        this._dialogRef.close();
    }

    deleteInvoice() {
        if (this.invoiceId)
            this._messageService.confirm(
                this.ls.l('InvoiceDeleteWarningMessage', this.data.title),
                isConfirmed => {
                    if (isConfirmed) {
                        this._loadingService.startLoading(true);
                        this._invoiceProxy.deleteInvoice(this.invoiceId).pipe(
                            finalize(() => this._loadingService.finishLoading(true))
                        ).subscribe((response) => {
                            this._notifyService.info(this.ls.l('SuccessfullyDeleted'));
                            this.data.refreshParent && this.data.refreshParent();
                            this.close();
                        });
                    }
                }
            );
    }
}
