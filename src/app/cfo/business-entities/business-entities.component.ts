import { Component, OnInit, OnDestroy, Injector, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material';
import { CFOComponentBase } from '@shared/cfo/cfo-component-base';
import { CreateBusinessEntityDialogComponent } from './create-business-entity-dialog/create-business-entity-dialog.component';

import { appModuleAnimation } from '@shared/animations/routerTransition';
import { DxDataGridComponent } from 'devextreme-angular';
import 'devextreme/data/odata/store';
import DsataSource from 'devextreme/data/data_source';
import { BankAccountsSelectComponent } from 'app/cfo/shared/bank-accounts-select/bank-accounts-select.component';
import { BusinessEntityDto, BusinessEntityServiceProxy, BusinessEntityUpdateBankAccountsInput, InstanceType } from 'shared/service-proxies/service-proxies';

import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/forkJoin';

import * as _ from 'underscore';

@Component({
    selector: 'business-entities',
    templateUrl: './business-entities.component.html',
    animations: [appModuleAnimation()],
    styleUrls: ['./business-entities.component.less'],
    providers: [BusinessEntityServiceProxy]
})
export class BusinessEntitiesComponent extends CFOComponentBase implements OnInit, OnDestroy {
    @ViewChild(BankAccountsSelectComponent) bankAccountSelector: BankAccountsSelectComponent;
    @ViewChild(DxDataGridComponent) dataGrid: DxDataGridComponent;
    headlineConfig: any;
    private rootComponent: any;

    private readonly dataSourceURI = 'BusinessEntity';
    private isAddButtonDisabled = false;
    private lastSelectedBusinessEntity;

    constructor(injector: Injector,
            public dialog: MatDialog,
            private _businessEntityService: BusinessEntityServiceProxy,
            private _router: Router) {
        super(injector);
        this.rootComponent = this.getRootComponent();
    }

    ngOnInit() {
        super.ngOnInit();
        this.rootComponent.overflowHidden(true);

        this.headlineConfig = {
            names: [this.l('Setup_Title'), this.l('SetupStep_BusinessEntities')],
            onRefresh: this.refreshDataGrid.bind(this),
            iconSrc: 'assets/common/icons/magic-stick-icon.svg',
            buttons: [
                {
                    enabled: true,
                    action: this.onNextClick.bind(this),
                    lable: this.l('Next'),
                    class: 'btn-layout next-button'
                }
            ]
        };

        this.dataSource = {
            store: {
                type: 'odata',
                url: this.getODataURL(this.dataSourceURI),
                version: this.getODataVersion(),
                beforeSend: function (request) {
                    request.headers['Authorization'] = 'Bearer ' + abp.auth.getToken();
                    request.headers['Abp.TenantId'] = abp.multiTenancy.getTenantIdCookie();
                }
            }
        };
    }

    onNextClick() {
        this._router.navigate(['app/cfo/' + this.instanceType.toLowerCase() + '/start']);
    }

    onToolbarPreparing(e) {
        e.toolbarOptions.items.unshift(
            {
                location: 'before',
                template: 'toolbarTitleTemplate'
            },
            {
                location: 'after',
                widget: 'dxButton',
                options: {
                    text: this.l('AddEntity'),
                    onClick: this.addEntity.bind(this),
                    bindingOptions: {'disabled': 'isAddButtonDisabled'},
                    elementAttr: {'class': 'link'}
                }
            },
            {
                location: 'after',
                widget: 'dxButton',
                options: {
                    hint: this.l('ColumnChooser'),
                    icon: 'column-chooser',
                    onClick: this.showColumnChooser.bind(this),
                }
            }
        );
    }

    onCellPrepared($event) {
        if ($event.rowType === 'data') {
            if ($event.column.dataField == 'Status' && $event.data.Status === 'Inactive') {
                $event.cellElement.parentElement.classList.add('inactive');
            }
        }
    }

    addEntity(e) {
        this.dialog.open(CreateBusinessEntityDialogComponent, {
            panelClass: 'slider',
            disableClose: true,
            closeOnNavigation: false,
            data: {
                instanceId: this.instanceId,
                instanceType: this.instanceType,
                localization: this.localizationSourceName
            }
        }).afterClosed().subscribe(options => {
            if (options && options.update) {
                this.refreshDataGrid();
            }
        });
    }

    locationColumn_calculateCellValue(rowData) {
        let values = [];
        if (rowData.StateId) {
            values.push(rowData.StateId);
        }
        if (rowData.CountryId) {
            values.push(rowData.CountryId);
        }

        return values.length > 0 ? values.join(', ') : null;
    }

    openBankAccountSelectComponent(businessEntity) {
        this.lastSelectedBusinessEntity = businessEntity;
        this.bankAccountSelector.targetBankAccountsTooltip = '#business-entity-arrow-' + businessEntity.Id;
        //this.bankAccountSelector.highlightedBankAccountIds = businessEntity.BankAccountIds;
        this.bankAccountSelector.setSelectedBankAccounts(businessEntity.BankAccountIds);
        this.bankAccountSelector.toggleBankAccountTooltip();
    }

    applyBankAccountIds(data) {
        if (this.lastSelectedBusinessEntity) {
            let bankAccountIdsForLink = _.difference(data.bankAccountIds, this.lastSelectedBusinessEntity.BankAccountIds);
            let bankAccountIdsForRemoveLink = _.difference(this.lastSelectedBusinessEntity.BankAccountIds, data.bankAccountIds);
            let bankAccountIdsForRelink = _.intersection(bankAccountIdsForLink, data.usedBankAccountIds);
            if (bankAccountIdsForRelink && bankAccountIdsForRelink.length) {
                abp.message.confirm(this.l('BusinessEntities_UpdateBankAccount_Confirm_Text'), this.l('BusinessEntities_UpdateBankAccount_Confirm_Title'), (result) => {
                    if (result) {
                        this.updateBankAccounts(bankAccountIdsForLink, bankAccountIdsForRemoveLink);
                    }
                });
            } else {
                this.updateBankAccounts(bankAccountIdsForLink, bankAccountIdsForRemoveLink);
            }
        }
    }

    updateBankAccounts(bankAccountIdsForLink, bankAccountIdsForRemoveLink) {
        let updateBankAccountsObservable: Observable<void>[] = [];

        if (bankAccountIdsForLink.length) {
            let linkInput = new BusinessEntityUpdateBankAccountsInput();
            linkInput.bankAccountIds = bankAccountIdsForLink;
            linkInput.businessEntityId = this.lastSelectedBusinessEntity.Id;
            linkInput.isLinked = true;

            updateBankAccountsObservable.push(this._businessEntityService.updateBankAccounts(InstanceType[this.instanceType], this.instanceId, linkInput));
        }
        if (bankAccountIdsForRemoveLink.length) {
            let removeLinkInput = new BusinessEntityUpdateBankAccountsInput();
            removeLinkInput.bankAccountIds = bankAccountIdsForRemoveLink;
            removeLinkInput.businessEntityId = this.lastSelectedBusinessEntity.Id;
            removeLinkInput.isLinked = false;

            updateBankAccountsObservable.push(this._businessEntityService.updateBankAccounts(InstanceType[this.instanceType], this.instanceId, removeLinkInput));
        }

        if (updateBankAccountsObservable.length) {
            Observable.forkJoin(
                updateBankAccountsObservable
            )
                .subscribe((result) => {
                    this.dataGrid.instance.refresh();
                    this.bankAccountSelector.getBankAccounts();
                    this.lastSelectedBusinessEntity = null;
                });
        }
    }

    refreshDataGrid() {
        this.dataGrid.instance.refresh();
    }

    showColumnChooser() {
        this.dataGrid.instance.showColumnChooser();
    }
    ngOnDestroy(): void {
        this.rootComponent.overflowHidden();
    }
}
