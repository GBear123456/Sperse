/** Core imports */
import { Component, OnInit, ViewChild, Injector } from '@angular/core';

/** Third party imports */
import { MatDialog } from '@angular/material/dialog';
import { DxContextMenuComponent } from 'devextreme-angular/ui/context-menu';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import { DxSelectBoxComponent } from 'devextreme-angular/ui/select-box';
import { CacheService } from 'ng2-cache-service';
import { finalize, filter } from 'rxjs/operators';
import * as _ from 'underscore';

/** Application imports */
import { DialogService } from '@app/shared/common/dialogs/dialog.service';
import { AppConsts } from '@shared/AppConsts';

import { ActivityServiceProxy, InvoiceServiceProxy, CreateInvoiceInput, UpdateInvoiceLineInput, UpdateInvoiceStatusInput,
    InvoiceInfo, UpdateInvoiceInput, CustomerServiceProxy, CreateInvoiceInputStatus, UpdateInvoiceInputStatus, 
    UpdateInvoiceStatusInputStatus, CreateInvoiceLineInput } from '@shared/service-proxies/service-proxies';
import { AppModalDialogComponent } from '@app/shared/common/dialogs/modal/app-modal-dialog.component';
import { ValidationHelper } from '@shared/helpers/ValidationHelper';
import { StringHelper } from '@shared/helpers/StringHelper';

@Component({
    templateUrl: 'create-invoice-dialog.component.html',
    styleUrls: [ '../../../shared/form.less', 'create-invoice-dialog.component.less' ],
    providers: [ DialogService, InvoiceServiceProxy, CustomerServiceProxy ]
})
export class CreateInvoiceDialogComponent extends AppModalDialogComponent implements OnInit {
    @ViewChild(DxContextMenuComponent) saveContextComponent: DxContextMenuComponent;
    @ViewChild(DxDataGridComponent) linesComponent: DxDataGridComponent;
    @ViewChild('contact') contactComponent: DxSelectBoxComponent;

    private lookupTimeout;
    private readonly SAVE_OPTION_DEFAULT = 1;
    private readonly SAVE_OPTION_CACHE_KEY = 'save_option_active_index';

    private validationError: string;

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

    constructor(
        injector: Injector,
        public dialog: MatDialog,
        private _invoiceProxy: InvoiceServiceProxy,
        private _customerProxy: CustomerServiceProxy,
        private _cacheService: CacheService,
        private _dialogService: DialogService
    ) {
        super(injector);

        this.localizationSourceName = AppConsts.localization.CRMLocalizationSourceName;
        this.saveContextMenuItems = [
            {text: this.l('SaveAndAddNew'), selected: false},
            {text: this.l('SaveAndClose'), selected: false}
        ];

        this._customerProxy.getAllByPhrase('', 10).subscribe((res) => {
            this.customers = res;
        });

        this.initInvoiceData();
        this.initToolbarConfig();
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
                && this.status != CreateInvoiceInputStatus.Submitted;

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
                                }
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
                        visible: this.data.invoice,
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
        let cacheKey = this.getCacheKey(this.SAVE_OPTION_CACHE_KEY),
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
        this._cacheService.set(this.getCacheKey(this.SAVE_OPTION_CACHE_KEY),
            this.saveContextMenuItems.findIndex((elm) => elm.text == option.text).toString());
    }

    ngOnInit() {
        super.ngOnInit();

        this.data.titleClearButton = true;
        this.data.editTitle = !this.disabledForUpdate;
        this.data.placeholder = this.l('Invoice #');
        this.data.buttons = [{
            id: this.saveButtonId,
            title: this.l('Save'),
            class: 'primary menu',
            action: this.save.bind(this)
        }];
        this.saveOptionsInit();
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

        this.notify.info(this.l('SavedSuccessfully'));
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
            return this.notify.error(this.l('InvoiceLinesShouldBeDefined'));

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
        $event.component.option('noDataText', this.l('LookingForItems'));

        clearTimeout(this.lookupTimeout);
        this.lookupTimeout = setTimeout(() => {
            $event.component.option('opened', true);
            $event.component.option('noDataText', this.l('LookingForItems'));

            this._customerProxy.getAllByPhrase(search, 10).subscribe((res) => {
                if (search == this.customer) {
                    if (!res['length'])
                        $event.component.option('noDataText', this.l('NoItemsFound'));

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
            this.message.confirm(this.l('DiscardConfirmation'), '', (confirmed) => {
                if (confirmed)
                    resetInternal();
            });
    }

    calculateLineAmount(data) {
        return data.Quantity * data.Rate || '';
    }

    calculateSummary(options) {
        if (options.name === "RowsSummary") {
            if (options.summaryProcess === "start") {
                options.totalValue = 0;
            } else if (options.summaryProcess === "calculate") {
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

    deleteInvoice() {
        if (this.invoiceId)
            this.message.confirm(
                this.l('InvoiceDeleteWarningMessage', this.data.title),
                isConfirmed => {
                    if (isConfirmed) {
                        this.startLoading(true)
                        this._invoiceProxy.deleteInvoice(this.invoiceId).pipe(
                            finalize(() => this.finishLoading(true))
                        ).subscribe((response) => {   
                            this.notify.info(this.l('SuccessfullyDeleted'));
                            this.data.refreshParent && this.data.refreshParent();
                            this.close();
                        });
                    }
                }
            );
    }
}