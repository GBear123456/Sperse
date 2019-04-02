/** Core imports */
import { Component, OnInit, AfterViewInit, ViewChild, Injector, OnDestroy } from '@angular/core';

/** Third party imports */
import { MatDialog } from '@angular/material/dialog';
import { Store, select } from '@ngrx/store';
import { DxContextMenuComponent } from 'devextreme-angular/ui/context-menu';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import { CacheService } from 'ng2-cache-service';
import { finalize, filter } from 'rxjs/operators';
import * as _ from 'underscore';

/** Application imports */
import { DialogService } from '@app/shared/common/dialogs/dialog.service';
import { PipelineService } from '@app/shared/pipeline/pipeline.service';
import { AppConsts } from '@shared/AppConsts';

import { CreateInvoiceInput } from '@shared/service-proxies/service-proxies';
import { AppModalDialogComponent } from '@app/shared/common/dialogs/modal/app-modal-dialog.component';
import { ValidationHelper } from '@shared/helpers/ValidationHelper';
import { StringHelper } from '@shared/helpers/StringHelper';

@Component({
    templateUrl: 'create-invoice-dialog.component.html',
    styleUrls: [ '../../../shared/form.less', 'create-invoice-dialog.component.less' ],
    providers: [ DialogService ]
})
export class CreateInvoiceDialogComponent extends AppModalDialogComponent implements OnInit, OnDestroy, AfterViewInit {
    @ViewChild(DxContextMenuComponent) saveContextComponent: DxContextMenuComponent;
    @ViewChild(DxDataGridComponent) linesComponent: DxDataGridComponent;

    private lookupTimeout;
    private readonly SAVE_OPTION_DEFAULT = 2;
    private readonly SAVE_OPTION_CACHE_KEY = 'save_option_active_index';

    private validationError: string;
    private isStatusSelected;

    statuses: any[] = [];
    statusId: number;

    saveButtonId = 'saveInvoiceOptions';
    saveContextMenuItems = [];

    customer: any;
    customers = [];

    currentDate = new Date();
    date = this.currentDate;
    dueDate = this.date;

    order: any;
    description = '';
    notes = '';
    lines = [];

    toolbarConfig = [];

    constructor(
        injector: Injector,
        public dialog: MatDialog,
        private _cacheService: CacheService,
        private _pipelineService: PipelineService,
        private _dialogService: DialogService
    ) {
        super(injector);

        this.localizationSourceName = AppConsts.localization.CRMLocalizationSourceName;
        this.saveContextMenuItems = [
            {text: this.l('SaveDraft'), selected: false},
            {text: this.l('SaveAndAddNew'), selected: false},
            {text: this.l('SaveAndClose'), selected: false}
        ];

        this.initToolbarConfig();
    }

    initToolbarConfig() {
        this.toolbarConfig = [
            {
                location: 'after',
                locateInMenu: 'auto',
                items: [
                    {
                        name: 'status',
                        widget: 'dxDropDownMenu',
                        disabled: true,
                        options: {
                            hint: 'Status',
                            items: [
                                {
                                    action: Function(),
                                    text: 'Active',
                                }, {
                                    action: Function(),
                                    text: 'Inactive',
                                }
                            ]
                        },
                        attr: {
                            'filter-selected': this.isStatusSelected
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
                        name: 'discard',
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

        this.data.editTitle = true;
        this.data.titleClearButton = true;
        this.data.placeholder = this.l('Invoice #');
        this.data.buttons = [{
            id: this.saveButtonId,
            title: this.l('Save'),
            class: 'primary menu',
            action: this.save.bind(this)
        }];
        this.saveOptionsInit();
    }

    ngAfterViewInit() {
        //setTimeout(() => this.lines = [], 2000);  
        //this.linesComponent.instance.option('dataSource', this.lines);
    }

    private createEntity(): void {
    }

    private afterSave(): void {
        if (this.saveContextMenuItems[0].selected) {
            this.resetFullDialog();
            this.notify.info(this.l('SavedSuccessfully'));
            this.data.refreshParent(true);
        } else if (this.saveContextMenuItems[1].selected) {
            this.data.refreshParent(true);
        } else {
            this.data.refreshParent(false);
            this.close();
        }
    }

    save(event?): void {
        if (event && event.offsetX > 195)
            return this.saveContextComponent
                .instance.option('visible', true);


        this.createEntity();
    }

    getDialogPossition(event, shiftX) {
        return this._dialogService.calculateDialogPosition(event, event.target.closest('div'), shiftX, -12);
    }

    getInputElementValue(event) {
        return event.element.getElementsByTagName('input')[0].value;
    }

    resetComponent(component) {
        component.reset();
        component.option('isValid', true);
    }

    initValidationGroup($event, validator) {
        this[validator].push($event.component);
    }

    customerLookupItems($event) {
        let search = this.customer = $event.event.target.value;
        if (this.customers.length)
            this.customers = [];

        clearTimeout(this.lookupTimeout);
        this.lookupTimeout = setTimeout(() => {
/*
            this._orgServiceProxy.getOrganizations(search, this.data.customerType || ContactGroup.Client, 10).subscribe((res) => {
                if (search == this.company)
                    this.customers = res;
                setTimeout(() => this.companyOptionChanged($event, true));
            });
*/
        }, 500);
    }

    customerOptionChanged($event, forced = false) {
        if (!this.customer || !this.customers.length || forced)
            $event.component.option('opened', Boolean(this.customers.length));
    }

    resetFullDialog(forced = true) {
        let resetInternal = () => {
        };

        if (forced)
            resetInternal();
        else
            this.message.confirm(this.l('DiscardConfirmation'), '', (confirmed) => {
                if (confirmed)
                    resetInternal();
            });
    }

    ngOnDestroy(): void {
    }

    onStatusChanged(event) {
    }

    onInvoiceNumberKeyUp(event) {
    }

    onToolbarPreparing(event) {
        event.toolbarOptions.items[0].locateInMenu = 'never';
    }
}
