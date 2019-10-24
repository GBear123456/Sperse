/** Core imports */
import { Component, OnInit, OnDestroy, Injector, ViewChild } from '@angular/core';

/** Third party imports */
import { MatDialog } from '@angular/material/dialog';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import 'devextreme/data/odata/store';
import { Observable, forkJoin } from 'rxjs';
import * as _ from 'underscore';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { BankAccountsService } from '@shared/cfo/bank-accounts/helpers/bank-accounts.service';
import { BusinessEntityServiceProxy, BusinessEntityUpdateBankAccountsInput, InstanceType } from 'shared/service-proxies/service-proxies';
import { BusinessEntityEditDialogComponent } from './business-entity-edit-dialog/business-entity-edit-dialog.component';
import { CFOComponentBase } from '@shared/cfo/cfo-component-base';
import { BankAccountsSelectDialogComponent } from '@app/cfo/shared/bank-accounts-select-dialog/bank-accounts-select-dialog.component';
import { DataGridService } from '@app/shared/common/data-grid.service.ts/data-grid.service';

@Component({
    selector: 'business-entities',
    templateUrl: './business-entities.component.html',
    animations: [appModuleAnimation()],
    styleUrls: ['./business-entities.component.less'],
    providers: [ BusinessEntityServiceProxy ]
})
export class BusinessEntitiesComponent extends CFOComponentBase implements OnInit, OnDestroy {
    @ViewChild(DxDataGridComponent) dataGrid: DxDataGridComponent;
    headlineConfig: any;
    private rootComponent: any;
    private readonly dataSourceURI = 'BusinessEntity';
    private isAddButtonDisabled = false;
    private lastSelectedBusinessEntity;

    constructor(
        injector: Injector,
        private businessEntityService: BusinessEntityServiceProxy,
        private bankAccountsService: BankAccountsService,
        public dialog: MatDialog
    ) {
        super(injector);
        this.rootComponent = this.getRootComponent();
    }

    ngOnInit() {
        this.rootComponent.overflowHidden(true);

        this.headlineConfig = {
            names: [this.l('Setup_Title'), this.l('SetupStep_BusinessEntities')],
            onRefresh: this.refreshDataGrid.bind(this),
            iconSrc: './assets/common/icons/magic-stick-icon.svg',
            buttons: [
                {
                    enabled: true,
                    action: this.onNextClick.bind(this),
                    label: this.l('Next'),
                    class: 'btn-layout next-button'
                }
            ]
        };

        this.dataSource = {
            store: {
                type: 'odata',
                url: this.getODataUrl(this.dataSourceURI),
                version: AppConsts.ODataVersion,
                deserializeDates: false,
                beforeSend: function (request) {
                    request.headers['Authorization'] = 'Bearer ' + abp.auth.getToken();
                }
            }
        };
        this.bankAccountsService.load();
        this.isAddButtonDisabled = !this.isInstanceAdmin;
    }

    onNextClick() {
        this._router.navigate([this.instanceUri + '/start']);
    }

    onToolbarPreparing(e) {
        e.toolbarOptions.items.unshift(
            {
                location: 'after',
                widget: 'dxButton',
                options: {
                    hint: this.l('ColumnChooser'),
                    icon: 'column-chooser',
                    onClick: DataGridService.showColumnChooser.bind(this, this.dataGrid),
                }
            }
        );
        if (!this.isAddButtonDisabled) {
            e.toolbarOptions.items.unshift({
                location: 'after',
                widget: 'dxButton',
                options: {
                    text: this.l('AddEntity'),
                    onClick: this.addEntity.bind(this),
                    bindingOptions: { 'disabled': this.isAddButtonDisabled },
                    elementAttr: { 'class': 'link' }
                }
            });
        }

        e.toolbarOptions.items.unshift(
            {
                location: 'before',
                template: 'toolbarTitleTemplate'
            });
    }

    onCellPrepared($event) {
        if ($event.rowType === 'data') {
            if ($event.column.dataField == 'Status' && $event.data.Status === 'Inactive') {
                $event.cellElement.parentElement.classList.add('inactive');
            }
        }
    }

    addEntity(e) {
        this.showEditDialog();
    }

    private showEditDialog(id?) {
        this.dialog.open(BusinessEntityEditDialogComponent, {
            panelClass: 'slider',
            disableClose: true,
            closeOnNavigation: false,
            data: {
                id: id
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

        this.bankAccountsService.changeSelectedBusinessEntities([], false);
        this.bankAccountsService.changeSelectedBankAccountsIds(businessEntity.BankAccountIds, false);

        this.dialog.open(BankAccountsSelectDialogComponent, {
            panelClass: 'slider',
            data: {
                applyForLink: true,
                applyDisabled: !this.isInstanceAdmin,
                highlightUsedRows: true,
                showBusinessEntitiesFilter: false
            }
        }).componentInstance.onApply.subscribe(() => {
            this.applyBankAccountIds();
        });
    }

    applyBankAccountIds() {
        if (this.lastSelectedBusinessEntity) {
            let bankAccountIdsForLink = _.difference(
                this.bankAccountsService._syncAccountsState.value.selectedBankAccountIds,
                this.lastSelectedBusinessEntity.BankAccountIds
            );
            let bankAccountIdsForRemoveLink = _.difference(
                this.lastSelectedBusinessEntity.BankAccountIds,
                this.bankAccountsService._syncAccountsState.value.selectedBankAccountIds
            );
            let bankAccountIdsForRelink = _.intersection(
                bankAccountIdsForLink,
                this.bankAccountsService._syncAccountsState.value.usedBankAccountIds
            );
            if (bankAccountIdsForRelink && bankAccountIdsForRelink.length) {
                abp.message.confirm(
                    this.l('BusinessEntities_UpdateBankAccount_Confirm_Text'),
                    this.l('BusinessEntities_UpdateBankAccount_Confirm_Title'),
                    (result) => {
                        if (result) {
                            this.updateBankAccounts(bankAccountIdsForLink, bankAccountIdsForRemoveLink);
                        }
                    }
                );
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

            updateBankAccountsObservable.push(this.businessEntityService.updateBankAccounts(
                InstanceType[this.instanceType],
                this.instanceId,
                linkInput
            ));
        }
        if (bankAccountIdsForRemoveLink.length) {
            let removeLinkInput = new BusinessEntityUpdateBankAccountsInput();
            removeLinkInput.bankAccountIds = bankAccountIdsForRemoveLink;
            removeLinkInput.businessEntityId = this.lastSelectedBusinessEntity.Id;
            removeLinkInput.isLinked = false;

            updateBankAccountsObservable.push(this.businessEntityService.updateBankAccounts(
                InstanceType[this.instanceType],
                this.instanceId,
                removeLinkInput
            ));
        }

        if (updateBankAccountsObservable.length) {
            forkJoin(
                updateBankAccountsObservable
            ).subscribe(() => {
                this.dataGrid.instance.refresh();
                this.bankAccountsService.load(false).subscribe();
                this.lastSelectedBusinessEntity = null;
            });
        }
    }

    refreshDataGrid() {
        this.dataGrid.instance.refresh();
    }

    ngOnDestroy(): void {
        this.rootComponent.overflowHidden();
    }

    onCellClick(event) {
        let col = event.column;
        if (col && (col.command || col.name == 'BankAccountIds')) {
            return;
        }

        let businessEntityId = event.data && event.data.Id;
        if (businessEntityId && !this.isAddButtonDisabled) {
            this.showEditDialog(businessEntityId);
        }
    }
}
