/** Core imports */
import { Component, OnInit, OnDestroy, Injector, ViewChild } from '@angular/core';

/** Third party imports */
import { MatDialog } from '@angular/material/dialog';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import 'devextreme/data/odata/store';
import DataSource from 'devextreme/data/data_source';
import ODataStore from 'devextreme/data/odata/store';
import { Observable, forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
import * as _ from 'underscore';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';
import { BankAccountsService } from '@shared/cfo/bank-accounts/helpers/bank-accounts.service';
import { BusinessEntityServiceProxy, BusinessEntityUpdateBankAccountsInput, InstanceType } from 'shared/service-proxies/service-proxies';
import { BusinessEntityEditDialogComponent } from './business-entity-edit-dialog/business-entity-edit-dialog.component';
import { CFOComponentBase } from '@shared/cfo/cfo-component-base';
import { BankAccountsSelectDialogComponent } from '@app/cfo/shared/bank-accounts-select-dialog/bank-accounts-select-dialog.component';
import { DataGridService } from '@app/shared/common/data-grid.service/data-grid.service';
import { HeadlineButton } from '@app/shared/common/headline/headline-button.model';
import { LeftMenuService } from '../shared/common/left-menu/left-menu.service';
import { BusinessEntityDto } from '@app/cfo/business-entities/business-entity-dto.interface';
import { BusinessEntityFields } from '@app/cfo/business-entities/business-entity-fields.enum';
import { KeysEnum } from '@shared/common/keys.enum/keys.enum';
import { FieldDependencies } from '@app/shared/common/data-grid.service/field-dependencies.interface';

@Component({
    selector: 'business-entities',
    templateUrl: './business-entities.component.html',
    styleUrls: ['./business-entities.component.less'],
    providers: [ BusinessEntityServiceProxy ]
})
export class BusinessEntitiesComponent extends CFOComponentBase implements OnInit, OnDestroy {
    @ViewChild(DxDataGridComponent) dataGrid: DxDataGridComponent;
    private rootComponent: any;
    private readonly dataSourceURI = 'BusinessEntity';
    private isAddButtonDisabled = !this.isInstanceAdmin;
    headlineButtons: HeadlineButton[] = [
        {
            enabled: !this.isAddButtonDisabled,
            action: () => this.addEntity(),
            label: this.l('AddEntity'),
            class: 'btn-layout next-button'
        }
    ];
    private lastSelectedBusinessEntity: BusinessEntityDto;
    contentWidth$: Observable<number> = this.leftMenuService.collapsed$.pipe(
        map((collapsed: boolean) => window.innerWidth - (collapsed || AppConsts.isMobile ? 0 : 324 ))
    );
    readonly businessEntityFields: KeysEnum<BusinessEntityDto> = BusinessEntityFields;
    private fieldsDependencies: FieldDependencies = {
        location: [
            this.businessEntityFields.StateId,
            this.businessEntityFields.State,
            this.businessEntityFields.CountryId
        ]
    };

    constructor(
        injector: Injector,
        private businessEntityService: BusinessEntityServiceProxy,
        private bankAccountsService: BankAccountsService,
        private leftMenuService: LeftMenuService,
        public dialog: MatDialog
    ) {
        super(injector);
        this.rootComponent = this.getRootComponent();
    }

    ngOnInit() {
        this.rootComponent.overflowHidden(true);
        this.dataSource = new DataSource({
            key: this.businessEntityFields.Id,
            store: new ODataStore({
                url: this.getODataUrl(this.dataSourceURI),
                version: AppConsts.ODataVersion,
                deserializeDates: false,
                beforeSend: (request) => {
                    this.isDataLoaded = false;
                    request.headers['Authorization'] = 'Bearer ' + abp.auth.getToken();
                    request.params.$select = DataGridService.getSelectFields(
                        this.dataGrid,
                        [
                            this.businessEntityFields.Id,
                            this.businessEntityFields.Status,
                            this.businessEntityFields.BankAccountIds
                        ],
                        this.fieldsDependencies
                    );
                },
                errorHandler: (error) => {
                    setTimeout(() => this.isDataLoaded = true);
                }
            })
        });
        this.bankAccountsService.load();
    }

    toggleColumnChooser() {
        DataGridService.showColumnChooser(this.dataGrid);
    }

    toggleCompactView() {
        DataGridService.toggleCompactRowsHeight(this.dataGrid);
    }

    repaintDataGrid(delay = 0) {
        if (this.dataGrid) {
            setTimeout(() => this.dataGrid.instance.repaint(), delay);
        }
    }

    onCellPrepared($event) {
        if ($event.rowType === 'data') {
            const businessEntity: BusinessEntityDto = $event.data;
            if ($event.column.dataField == this.businessEntityFields.Status && businessEntity.Status === 'Inactive') {
                $event.cellElement.parentElement.classList.add('inactive');
            }
        }
    }

    addEntity() {
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
        const state = rowData.State || rowData.StateId;
        if (state) {
            values.push(state);
        }
        if (rowData.CountryId) {
            values.push(rowData.CountryId);
        }

        return values.length > 0 ? values.join(', ') : null;
    }

    openBankAccountSelectComponent(businessEntity: BusinessEntityDto) {
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
        const businessEntity: BusinessEntityDto = event.data;
        let businessEntityId = businessEntity && businessEntity.Id;
        if (businessEntityId && !this.isAddButtonDisabled) {
            this.showEditDialog(businessEntityId);
        }
    }

    onContentReady() {
        this.setGridDataLoaded();
    }
}
