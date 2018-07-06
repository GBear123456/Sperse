/** Core imports */
import { Component, OnInit, AfterViewInit, OnDestroy, Injector, ViewChild } from '@angular/core';

/** Third party imports */
import { DxDataGridComponent } from 'devextreme-angular';
import { forkJoin } from 'rxjs';

/** Application imports */
import { CFOComponentBase } from '@shared/cfo/cfo-component-base';
import {
    BankAccountsServiceProxy,
    BankAccountDto,
    InstanceType,
    SyncAccountBankDto,
    SecurityManagementServiceProxy,
    Permission,
    UserServiceProxy,
    UserListDto
} from 'shared/service-proxies/service-proxies';
import { AccountPermission } from './account-permission.model';

@Component({
    selector: 'app-permissions',
    templateUrl: './permissions.component.html',
    styleUrls: ['./permissions.component.less'],
    providers: [ BankAccountsServiceProxy, SecurityManagementServiceProxy, UserServiceProxy ]
})
export class PermissionsComponent extends CFOComponentBase implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild(DxDataGridComponent) dataGrid: DxDataGridComponent;
    private rootComponent: any;
    users: UserListDto[];
    syncAccounts: SyncAccountBankDto[];
    columnsConfiguration = {
        'accountId': {
            'visible': false
        },
        'accountName': {
            'caption': this.l('UserPermissions_BankAccountName'),
            'visible': true,
            'sortIndex': 0,
            'allowEditing': false,
            'width': '250px'
        },
        'accountNumber': {
            'caption': this.l('UserPermissions_BankAccountNumber'),
            'visible': true,
            'sortIndex': 1,
            'allowEditing': false,
            'width': '230px'
        },
        'entityName': {
            'visible': false,
            'groupIndex': 0,
            'groupCellTemplate': this.customizeEntityGroup.bind(this)
        },
        'user': {
            'visible': true,
            'cssClass': 'userColumn',
            'headerCellTemplate': this.customizeUserHeader.bind(this),
            'width': '170px'
        }
    };
    public headlineConfig = {
        names: [this.l('SetupStep_Permissions')],
        iconSrc: 'assets/common/icons/user-permissions.svg',
        onRefresh: this.onRefresh.bind(this),
    };
    constructor(injector: Injector,
                private userServiceProxy: UserServiceProxy,
                private bankAccountsServiceProxy: BankAccountsServiceProxy,
                private securityManagmentServiceProxy: SecurityManagementServiceProxy) {
        super(injector);
    }

    ngOnInit() {
        const usersObservable = this.userServiceProxy.getUsers(
            undefined,
            'Pages.CFO.ClientInstanceAdmin',
            undefined,
            undefined,
            20,
            0
        );
        const bankAccountsObservable = this.bankAccountsServiceProxy.getBankAccounts(InstanceType[this.instanceType], this.instanceId, 'USD');
        forkJoin(
            usersObservable,
            bankAccountsObservable
        ).subscribe(
            res => {
                this.users = res[0] && res[0].items ? res[0].items : null;
                this.syncAccounts = res[1];
            },
            e => {},
            () => {
                this.dataSource = this.createPermissionsDataSource(this.users, this.syncAccounts, /*, this.permissions*/);
            }
        );
    }

    ngAfterViewInit(): void {
        this.rootComponent = this.getRootComponent();
        this.rootComponent.overflowHidden(true);
    }

    ngOnDestroy() {
        this.rootComponent.overflowHidden(false);
    }

    private createPermissionsDataSource(users: UserListDto[], syncAccounts: SyncAccountBankDto[]/*, permissions: */): AccountPermission[] {
        let accountsPermissions = [];
        syncAccounts.reduce((bankAccounts, syncAccount) => bankAccounts.concat(syncAccount.bankAccounts), [])
                    .forEach((bankAccount: BankAccountDto) => {
                        const accountPermission: AccountPermission = {
                            accountId: bankAccount.id,
                            accountName: bankAccount.accountName,
                            accountNumber: bankAccount.accountNumber,
                            entityName: bankAccount.businessEntityName
                        };
                        /** @todo change for the real permissions from server */
                        users.forEach(user => accountPermission[user.id] = false);
                        accountsPermissions.push(accountPermission);
                    });
        return accountsPermissions;
    }

    customizeColumns = (columns) => {
        /** Apply configuration to the columns */
        columns.forEach((column, columnIndex) => {
            let configuration = this.columnsConfiguration[column.dataField] || this.columnsConfiguration['user'];
            columns[columnIndex] = { ...column, ...configuration };
        });
        /** Sort columns (users in the end) */
        columns.sort(column => this.columnsConfiguration[column.dataField] ? -1 : 1);
    }

    customizeUserHeader(columnHeader, headerInfo) {
        let user = this.users.find(user => user.id === +headerInfo.column.dataField);
        columnHeader.insertAdjacentHTML('beforeEnd',
            `<div class="userFullName dx-datagrid-text-content dx-text-content-alignment-left">${user.userName}</div>
             <div class="userEmail">${user.emailAddress}</div>`);
        return columnHeader;
    }

    onCellHoverChanged(e) {
        if (this.isUserColumn(e)) {
            let target = e.event.target && e.event.target.closest('.' + this.columnsConfiguration['user'].cssClass);
            let relatedTarget = e.event.relatedTarget && e.event.relatedTarget.closest('.' + this.columnsConfiguration['user'].cssClass);
            if (target !== relatedTarget) {
                if (e.eventType === 'mouseover') {
                    $(`.${this.columnsConfiguration['user'].cssClass}:nth-child(${e.cellElement.cellIndex + 1})`).addClass('hovered');
                }

                if (e.eventType === 'mouseout') {
                    $(`.${this.columnsConfiguration['user'].cssClass}:nth-child(${e.cellElement.cellIndex + 1})`).removeClass('hovered');
                }
            }
        }
    }

    customizeEntityGroup(cellElement, cellInfo) {
        /** Divide cell to the equal cells instead of one to have group selection (hack to use column hover also on grouping row !!!) */
        const columnsAmount = cellInfo.column.colspan;
        cellElement.setAttribute('colspan', 1);
        for (let i = 0; i < columnsAmount - 1; i++) {
            let cellCopy = cellElement.cloneNode(true);
            /** Columns after 0 are users columns (hope so :)) */
            if (i > 0) {
                cellCopy.classList.add(this.columnsConfiguration['user'].cssClass);
            }
            cellElement.parentElement.appendChild(cellCopy);
        }
        /** Set entity name */
        cellElement.innerText = cellInfo.value;
    }

    isUserColumn(e) {
        return e.cellElement.classList.contains(this.columnsConfiguration['user'].cssClass);
    }

    onRefresh() {
        console.log('refresh');
    }

    onRowUpdating(e) {
        /** If user updates permission */
        const userId: number = +Object.keys(e.newData)[0];
        const permission = e.newData[userId];
        const instanceType = <any>this.instanceType;
        let methodObservable = permission ?
                               this.securityManagmentServiceProxy.grantBankAccountPermissions(instanceType, this.instanceId, e.oldData.accountId, userId, Permission.All) :
                               this.securityManagmentServiceProxy.revokeBankAccountPermissions(instanceType, this.instanceId, e.oldData.accountId, [userId]);
        methodObservable.subscribe(res => {
            this.notify.success(this.ls('Platform', 'AppliedSuccessfully'));
        });
    }

    calculatePermissionsTableHeight() {
        return window.innerHeight - 180;
    }
}
