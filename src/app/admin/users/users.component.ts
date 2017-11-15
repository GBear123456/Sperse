import { Component, AfterViewInit, Injector, ViewEncapsulation, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Http } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import { UserServiceProxy, UserListDto, EntityDtoOfInt64 } from '@shared/service-proxies/service-proxies';
import { PermissionCheckerService } from '@abp/auth/permission-checker.service';
import { NotifyService } from '@abp/notify/notify.service';
import { AppConsts } from '@shared/AppConsts';
import { AppComponentBase } from '@shared/common/app-component-base';
import { FileDownloadService } from '@shared/utils/file-download.service';
import { FlatPermissionWithLevelDto, TokenAuthServiceProxy } from '@shared/service-proxies/service-proxies';
import { CreateOrEditUserModalComponent } from './create-or-edit-user-modal.component';
import { EditUserPermissionsModalComponent } from './edit-user-permissions-modal.component';
import { ImpersonationService } from './impersonation.service';
import { JTableHelper } from '@shared/helpers/JTableHelper';
import { appModuleAnimation } from '@shared/animations/routerTransition';

import * as moment from 'moment';

@Component({
    templateUrl: './users.component.html',
    styleUrls: ['./users.component.less'],
    encapsulation: ViewEncapsulation.None,
    animations: [appModuleAnimation()]
})
export class UsersComponent extends AppComponentBase implements AfterViewInit {

    @ViewChild('createOrEditUserModal') createOrEditUserModal: CreateOrEditUserModalComponent;
    @ViewChild('editUserPermissionsModal') editUserPermissionsModal: EditUserPermissionsModalComponent;

    //Filters
    advancedFiltersAreShown: boolean = false;
    filterText: string = '';
    selectedPermission: string = '';
    role: number = undefined;

    private _$usersTable: JQuery;

    constructor(
        injector: Injector,
        private _http: Http,
        private _userServiceProxy: UserServiceProxy,
        private _notifyService: NotifyService,
        private _fileDownloadService: FileDownloadService,
        private _impersonationService: ImpersonationService,
        private _tokenAuth: TokenAuthServiceProxy,
        private _activatedRoute: ActivatedRoute
    ) {
        super(injector);
    }

    ngAfterViewInit(): void {

        let self = this;
        this.filterText = this._activatedRoute.snapshot.queryParams['filterText'] || '';
        let initUsersTable = () => {
            this._$usersTable = $('#UsersTable');
            this._$usersTable.jtable({

                title: this.l('Users'),

                paging: true,
                sorting: true,
                multiSorting: true,

                actions: {
                    listAction: (postData, jtParams: JTableParams) => {
                        return JTableHelper.toJTableListAction(this._userServiceProxy.getUsers(
                            this.filterText,
                            this.permission ? this.selectedPermission : undefined,
                            this.role,
                            jtParams.jtSorting,
                            jtParams.jtPageSize,
                            jtParams.jtStartIndex
                        ));
                    }
                },

                fields: {
                    id: {
                        key: true,
                        list: false
                    },
                    actions: {
                        title: this.l('Actions'),
                        width: '15%',
                        sorting: false,
                        type: 'record-actions',
                        cssClass: 'btn btn-xs btn-primary blue',
                        text: '<i class="fa fa-cog"></i> ' + this.l('Actions') + ' <span class="caret"></span>',
                        items: [{
                            text: this.l('LoginAsThisUser'),
                            visible: data => {
                                return self.isGranted('Pages.Administration.Users.Impersonation') && data.record.id !== self.appSession.userId;
                            },
                            action(data) {
                                self._impersonationService.impersonate(data.record.id, self.appSession.tenantId);
                            }
                        }, {
                            text: this.l('Edit'),
                            visible: (): boolean => {
                                return self.isGranted('Pages.Administration.Users.Edit');
                            },
                            action(data) {
                                self.createOrEditUserModal.show(data.record.id);
                            }
                        }, {
                            text: this.l('Permissions'),
                            visible: (): boolean => {
                                return self.isGranted('Pages.Administration.Users.ChangePermissions');
                            },
                            action(data) {
                                self.editUserPermissionsModal.show(data.record.id, data.record.userName);
                            }
                        }, {
                            text: this.l('Unlock'),
                            action(data) {
                                self._userServiceProxy.unlockUser(new EntityDtoOfInt64({ id: data.record.id })).subscribe(() => {
                                    self.notify.success(self.l('UnlockedTheUser', data.record.userName));
                                });
                            }
                        }, {
                            text: this.l('Delete'),
                            visible: (): boolean => {
                                return self.isGranted('Pages.Administration.Users.Delete');
                            },
                            action(data) {
                                self.deleteUser(data.record);
                            }
                        }]
                    },
                    userName: {
                        title: this.l('UserName'),
                        width: '9%'
                    },
                    name: {
                        title: this.l('Name'),
                        width: '10%'
                    },
                    surname: {
                        title: this.l('Surname'),
                        width: '10%'
                    },
                    roles: {
                        title: this.l('Roles'),
                        width: '12%',
                        sorting: false,
                        display: function (data: JTableFieldOptionDisplayData<UserListDto>) {
                            let roleNames = '';

                            for (let j = 0; j < data.record.roles.length; j++) {
                                if (roleNames.length) {
                                    roleNames = roleNames + ', ';
                                }

                                roleNames = roleNames + data.record.roles[j].roleName;
                            };

                            return roleNames;
                        }
                    },
                    emailAddress: {
                        title: this.l('EmailAddress'),
                        width: '15%'
                    },
                    isEmailConfirmed: {
                        title: this.l('EmailConfirm'),
                        width: '6%',
                        display: (data: JTableFieldOptionDisplayData<UserListDto>) => {
                            if (data.record.isEmailConfirmed) {
                                return '<span class="label label-success">' + this.l('Yes') + '</span>';
                            } else {
                                return '<span class="label label-default">' + this.l('No') + '</span>';
                            }
                        }
                    },
                    isActive: {
                        title: this.l('Active'),
                        width: '6%',
                        display: (data: JTableFieldOptionDisplayData<UserListDto>) => {
                            if (data.record.isActive) {
                                return '<span class="label label-success">' + this.l('Yes') + '</span>';
                            } else {
                                return '<span class="label label-default">' + this.l('No') + '</span>';
                            }
                        }
                    },
                    lastLoginTime: {
                        title: this.l('LastLoginTime'),
                        width: '7%',
                        display: (data: JTableFieldOptionDisplayData<UserListDto>): any => {
                            if (data.record.lastLoginTime) {
                                return moment(data.record.lastLoginTime).format('L');
                            }

                            return '-';
                        }
                    },
                    creationTime: {
                        title: this.l('CreationTime'),
                        width: '7%',
                        display: (data: JTableFieldOptionDisplayData<UserListDto>) => moment(data.record.creationTime).format('L')
                    }
                }
            });

            this.getUsers();
        };

        initUsersTable();
    }

    getUsers(): void {
        this._$usersTable.jtable('load');
    }

    exportToExcel(): void {
        this._userServiceProxy.getUsersToExcel()
            .subscribe(result => {
                this._fileDownloadService.downloadTempFile(result);
            });
    }

    createUser(): void {
        this.createOrEditUserModal.show();
    }

    deleteUser(user: UserListDto): void {
        if (user.userName === AppConsts.userManagement.defaultAdminUserName) {
            this.message.warn(this.l('{0}UserCannotBeDeleted', AppConsts.userManagement.defaultAdminUserName));
            return;
        }

        this.message.confirm(
            this.l('UserDeleteWarningMessage', user.userName),
            (isConfirmed) => {
                if (isConfirmed) {
                    this._userServiceProxy.deleteUser(user.id)
                        .subscribe(() => {
                            this.getUsers();
                            this.notify.success(this.l('SuccessfullyDeleted'));
                        });
                }
            }
        );
    }
}
