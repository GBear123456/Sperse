/** Core imports */
import { Component, OnInit, AfterViewInit, OnDestroy, Injector, ViewChild } from '@angular/core';
import { Router } from '@angular/router';

/** Third party imports */
import { MatDialog } from '@angular/material';
import { DxDataGridComponent } from 'devextreme-angular';
import DataSource from 'devextreme/data/data_source';
import ArrayStore from 'devextreme/data/array_store';
import { forkJoin } from 'rxjs';

/** Application imports */
import { CFOComponentBase } from '@shared/cfo/cfo-component-base';
import {
    BankAccountsServiceProxy,
    BankAccountDto,
    SyncAccountBankDto,
    BankAccountUsers,
    SecurityManagementServiceProxy,
    Permission,
    UserServiceProxy,
    UserListDto
} from 'shared/service-proxies/service-proxies';
import { AccountPermission } from './account-permission.model';
import { UsersDialogComponent } from './users-dialog/users-dialog.component';

@Component({
    selector: 'app-permissions',
    templateUrl: './permissions.component.html',
    styleUrls: ['./permissions.component.less'],
    providers: [ BankAccountsServiceProxy, SecurityManagementServiceProxy, UserServiceProxy ]
})
export class PermissionsComponent extends CFOComponentBase implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild(DxDataGridComponent) dataGrid: DxDataGridComponent;
    private rootComponent: any;
    users: UserListDto[] = [];
    showenUsersIds: number[] = [];
    bankAccountsUsers: BankAccountUsers[];
    syncAccounts: SyncAccountBankDto[];
    showAddUserButton = false;
    isDataLoaded = false;
    dataSource: DataSource;
    addedUsersIds: number[];
    columnsConfiguration = {
        'accountId': {
            'visible': false,
            'visibleIndex': 0
        },
        'accountName': {
            'allowEditing': false,
            'caption': this.l('UserPermissions_BankAccountName'),
            'width': '250px',
            'visibleIndex': 1
        },
        'accountNumber': {
            'allowEditing': false,
            'caption': this.l('UserPermissions_BankAccountNumber'),
            'width': '230px',
            'visibleIndex': 2
        },
        'entityName': {
            'visible': false,
            'groupIndex': 0,
            'groupCellTemplate': this.customizeEntityGroup.bind(this),
            'visibleIndex': 3
        },
        'user': {
            'cssClass': 'userColumn',
            'calculateCellValue': this.calculateUserCellValue,
            'headerCellTemplate': this.customizeUserHeader.bind(this),
            'width': '170px',
            'visibleIndex': 4
        },
        'addUser': {
            'alignment': 'left',
            'allowEditing': false,
            'allowSorting': false,
            'dataField': 'addUser',
            'headerCellTemplate': 'addUserTemplate',
            'width': '60px',
            'visibleIndex': 5
        }
    };
    public headlineConfig = {
        names: [this.l('SetupStep_Permissions')],
        iconSrc: 'assets/common/icons/user-permissions.svg',
        onRefresh: this.onRefresh.bind(this),
    };
    constructor(injector: Injector,
                private _router: Router,
                private userServiceProxy: UserServiceProxy,
                private bankAccountsServiceProxy: BankAccountsServiceProxy,
                private securityManagmentServiceProxy: SecurityManagementServiceProxy,
                public dialog: MatDialog) {
        super(injector);
    }

    ngOnInit() {
        this.addedUsersIds = [];
        this.loadData();
    }

    loadData() {
        this.startLoading(true);
        this.showenUsersIds = [];
        const instanceType = <any>this.instanceType;
        const usersObservable = this.userServiceProxy.getUsers(
            false,
            undefined,
            'Pages.CFO.MainInstanceAccess',
            undefined,
            undefined,
            100,
            0
        );
        const bankAccountsObservable = this.bankAccountsServiceProxy.getBankAccounts(instanceType, this.instanceId, 'USD');
        const usersPermissionsObservable = this.securityManagmentServiceProxy.getBankAccountAssignedUsers(instanceType, this.instanceId);
        forkJoin(
            usersObservable,
            bankAccountsObservable,
            usersPermissionsObservable
        ).subscribe(
            res => {
                this.users = res[0] && res[0].items ? res[0].items : null;
                this.syncAccounts = res[1];
                this.bankAccountsUsers = res[2];
            },
            e => { 
                this.finishLoading(true);
                this._router.navigate(['app/cfo/main/start']);                
            },
            () => {
                this.dataSource = new DataSource(
                    new ArrayStore({
                        data: this.createPermissionsDataSource(this.bankAccountsUsers, this.syncAccounts),
                        onLoaded: () => {
                            if (!this.dataGrid.instance.option('visible')) {
                                this.dataGrid.instance.option('visible', true);
                            }
                        }
                    })
                );
                this.isDataLoaded = true;
                this.finishLoading(true);
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

    private createPermissionsDataSource(bankAccountsUsers: BankAccountUsers[], allSyncAccounts: SyncAccountBankDto[]): AccountPermission[] {
        let accountsPermissions = [];
        allSyncAccounts.reduce((bankAccounts, syncAccount) => bankAccounts.concat(syncAccount.bankAccounts), [])
            .forEach((bankAccount: BankAccountDto) => {
                const accountPermission: AccountPermission = {
                    accountId: bankAccount.id,
                    accountName: bankAccount.accountName,
                    accountNumber: bankAccount.accountNumber,
                    entityName: bankAccount.businessEntityName
                };
                const account = bankAccountsUsers.find(account => account.bankAccountId === bankAccount.id);
                if (account && account.userIds.length) {
                    account.userIds.forEach(userId => {
                        if (this.users.find(user => user.id === userId)) {
                            accountPermission[userId] = true;
                            if (this.showenUsersIds.indexOf(userId) === -1) {
                                this.showenUsersIds.push(userId);
                            }
                        }
                    });
                }
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
        columns.sort((columnA, columnB) => columnA.visibleIndex >= columnB.visibleIndex ? -1 : 1);

        /** Add addUser column (with add user button) */
        let addUserColumn = columns.find(column => column.dataField === this.columnsConfiguration['addUser'].dataField);
        const showenUsersColumnsAmount = columns.filter(column => column.visible && !isNaN(parseInt(column.dataField))).length;
        this.showAddUserButton = showenUsersColumnsAmount !== this.users.length;
        const addUserColumnConfig = {
            ...this.columnsConfiguration['addUser'],
            ...{ visible: this.showAddUserButton }
        };
        /** Add new addUser column if it's not added yet */
        if (!addUserColumn) {
            columns.push(addUserColumnConfig);
        } else {
            /** Else - change config of the add user column (visible or not may change depend on visible users) */
            addUserColumn.visible = this.showAddUserButton;
        }
    }

    customizeUserHeader(columnHeader, headerInfo) {
        let user = this.users.find(user => user.id === +headerInfo.column.dataField);
        columnHeader.insertAdjacentHTML('beforeEnd',
            `<div class="userFullName dx-datagrid-text-content dx-text-content-alignment-left">${user.userName}</div>
             <div class="userEmail">${user.emailAddress}</div>
             <img src="/assets/common/icons/remove-user-icon.svg" [alt]="l('UserPermissions_RemoveUser')" class="removeUserButton" (click)="removeUser(${+user.id})"/>`);
        return columnHeader;
    }

    calculateUserCellValue(data) {
        /** To avoid wrong "intermediate" state
         *  https://www.devexpress.com/Support/Center/Question/Details/T514824/checkbox-and-null-value */
        const columnConfig = <any>this;
        return data.hasOwnProperty(columnConfig.dataField) && data[columnConfig.dataField];
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
        const lastUserColumnIndex = this.showAddUserButton ? columnsAmount - 2 : columnsAmount - 1;
        for (let i = 0; i < columnsAmount - 1; i++) {
            let cellCopy = cellElement.cloneNode(true);
            /** Columns after 0 are users columns (hope so :)) */
            if (i > 0 && i < lastUserColumnIndex) {
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
        /** Becomes visible after new data loading (dataSource onLoaded method)*/
        this.dataGrid.instance.option('visible', false);
        this.removeAddedUserColumns();
        this.loadData();
    }

    /**
     * Hack to fix error with double columns
     */
    removeAddedUserColumns() {
        this.addedUsersIds.forEach(userId => {
            this.dataGrid.instance.deleteColumn(userId.toString());
        });
        this.addedUsersIds = [];
    }

    onRowUpdating(e) {
        /** If user updates permission */
        const userId: number = +Object.keys(e.newData)[0];
        const permission = e.newData[userId];
        const instanceType = <any>this.instanceType;
        let methodObservable = permission ?
                               this.securityManagmentServiceProxy.grantBankAccountPermissions(instanceType, this.instanceId, e.oldData.accountId, userId, Permission.All) :
                               this.securityManagmentServiceProxy.revokeBankAccountPermissions(instanceType, this.instanceId, userId, [e.oldData.accountId]);
        methodObservable.subscribe(res => {
            this.notify.success(this.ls('Platform', 'AppliedSuccessfully'));
        });
    }

    calculatePermissionsTableWidth() {
        /** If we set static width - then last column (addUserButton) moves to the right */
        return this.showenUsersIds.length > 6
               ? window.innerWidth - 381
               : 'auto' ;
    }

    calculatePermissionsTableHeight() {
        return window.innerHeight - 180;
    }

    showUsersPopup(e) {
        const config: any = {
            data: { users: this.users.filter(user => this.showenUsersIds.indexOf(user.id) === -1) },
            width: '242px',
            height: '231px',
            position: {
                top: `${e.clientY + 30}px`,
                left: `${e.clientX - 182}px`
            },
            backdropClass: 'usersBackdrop',
            panelClass: 'usersPanel'
        };
        this.dialog.open(UsersDialogComponent, config)
            .afterClosed().subscribe(result => {
                if (result) {
                    this.addNewUser(+result);
                }
            });
    }

    onCellClick(e) {
        if (e.event.target.classList.contains('removeUserButton')) {
            this.dataGrid.instance.columnOption(e.column.dataField, 'allowSorting', false);
            this.removeUser(+e.column.dataField);
        }
    }

    /**
     * Add new user column to the datagrid
     * @param {number} userId
     */
    addNewUser(userId: number) {
        this.dataGrid.instance.addColumn(
            {
                ...{ dataField: userId.toString() },
                ...this.columnsConfiguration['user']
            });
        this.addedUsersIds.push(userId);
        this.showenUsersIds.push(userId);
    }

    /**
     * Remove user from the datagrid and revoke all his permissions for accounts
     * @param {number} userId
     */
    removeUser(userId: number) {
        /** Revoke user permissions */
        const instanceType = <any>this.instanceType;
        const bankAccounts = this.bankAccountsUsers.map(bankAccount => bankAccount.bankAccountId);
        this.securityManagmentServiceProxy
            .revokeBankAccountPermissions(instanceType, this.instanceId, userId, bankAccounts)
            .subscribe(res => {
                const stringUserId: string = userId.toString();
                /** Remove user from datagrid */
                this.dataGrid.instance.deleteColumn(stringUserId);
                /** Update data source */
                this.dataSource.store()._array.forEach(account => {
                    if (account.hasOwnProperty(stringUserId)) {
                        account[stringUserId] = false;
                    }
                });
                this.showenUsersIds.splice(this.showenUsersIds.indexOf(userId), 1);
                this.notify.success(this.ls('Platform', 'SuccessfullyDeleted'));
            });
    }
}

