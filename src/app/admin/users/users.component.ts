import { Component, Injector, ViewEncapsulation, ViewChild, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import {
    UserServiceProxy, UserListDto, EntityDtoOfInt64, RoleServiceProxy,
    PermissionServiceProxy, FlatPermissionWithLevelDto
} from '@shared/service-proxies/service-proxies';
import { NotifyService } from '@abp/notify/notify.service';
import { AppConsts } from '@shared/AppConsts';
import { AppComponentBase } from '@shared/common/app-component-base';
import { FileDownloadService } from '@shared/utils/file-download.service';
import { TokenAuthServiceProxy } from '@shared/service-proxies/service-proxies';
import { CreateUserDialogComponent } from './create-user-dialog/create-user-dialog.component';
import { ImpersonationService } from './impersonation.service';
import { appModuleAnimation } from '@shared/animations/routerTransition';

import { DxDataGridComponent } from 'devextreme-angular';
import DataSource from 'devextreme/data/data_source';

import { FiltersService } from '@shared/filters/filters.service';
import { FilterModel } from '@shared/filters/models/filter.model';
import { FilterRadioGroupComponent } from '@shared/filters/radio-group/filter-radio-group.component';
import { FilterRadioGroupModel } from '@shared/filters/radio-group/filter-radio-group.model';

import { AppService } from '@app/app.service';
import { forkJoin } from 'rxjs';

import { MatDialog } from '@angular/material';

@Component({
    templateUrl: './users.component.html',
    styleUrls: ['./users.component.less'],
    animations: [appModuleAnimation()]
})
export class UsersComponent extends AppComponentBase implements OnDestroy {
    @ViewChild(DxDataGridComponent) dataGrid: DxDataGridComponent;

    //Filters
    private filters: FilterModel[];
    selectedPermission: string;
    role: number;
    private subRouteParams: any;

    public actionMenuItems: any;
    public actionRecord: any;
    public headlineConfig = {
        names: [this.l('Users')],
        icon: 'people',
        onRefresh: this.invalidate.bind(this),
        buttons: [
            {
                enabled: this.isGranted('Pages.Administration.Users.Create'),
                action: this.createUser.bind(this),
                lable: this.l('CreateNewUser')
            }
        ]
    };

    private rootComponent: any;
    private formatting = AppConsts.formatting;

    dataSource: DataSource;

    constructor(
        injector: Injector,
        public dialog: MatDialog,
        private _router: Router,
        private _appService: AppService,
        private _filtersService: FiltersService,
        private _userServiceProxy: UserServiceProxy,
        private _notifyService: NotifyService,
        private _fileDownloadService: FileDownloadService,
        private _tokenAuth: TokenAuthServiceProxy,
        private _activatedRoute: ActivatedRoute,
        private _permissionService: PermissionServiceProxy,
        private _roleService: RoleServiceProxy,
        public _impersonationService: ImpersonationService
    ) {
        super(injector);

        this.actionMenuItems = [
            {
                text: this.l('LoginAsThisUser'),
                visible: this.permission.isGranted('Pages.Administration.Users.Impersonation'),
                action: () => {
                    this._impersonationService.impersonate(this.actionRecord.id, this.appSession.tenantId);
                }
            },
            {
                text: this.l('Edit'),
                visible: this.permission.isGranted('Pages.Administration.Users.Edit'),
                action: () => {
                    this.openUserDetails(this.actionRecord.id);
                }
            },
            {
                text: this.l('Unlock'),
                visible: this.permission.isGranted('Pages.Administration.Users.ChangePermissions'),
                action: () => {
                    this.unlockUser(this.actionRecord);
                }
            },
            {
                text: this.l('Delete'),
                visible: this.permission.isGranted('Pages.Administration.Users.Delete'),
                action: () => {
                    this.deleteUser(this.actionRecord);
                }
            }
        ].filter(Boolean);

        this.dataSource = new DataSource({
            key: 'id',
            load: (loadOptions) => {
                return this._userServiceProxy.getUsers(
                    true,
                    this.searchValue || undefined,
                    this.selectedPermission || undefined,
                    this.role || undefined,
                    false,
                    (loadOptions.sort || []).map((item) => {
                        return item.selector + ' ' + (item.desc ? 'DESC' : 'ASC');
                    }).join(','), loadOptions.take, loadOptions.skip
                ).toPromise().then(response => {
                    return {
                        data: response.items,
                        totalCount: response.totalCount
                    };
                });
            }
        });

        this.activate();
    }

    initToolbarConfig() {
        this._appService.updateToolbar([
            {
                location: 'before', items: [
                    {
                        name: 'filters',
                        action: event => {
                            setTimeout(() => {
                                this.dataGrid.instance.repaint();
                            }, 1000);
                            this._filtersService.fixed = !this._filtersService.fixed;
                        },
                        options: {
                            checkPressed: () => {
                                return this._filtersService.fixed;
                            },
                            mouseover: event => {
                                this._filtersService.enable();
                            },
                            mouseout: event => {
                                if (!this._filtersService.fixed)
                                    this._filtersService.disable();
                            }
                        },
                        attr: {
                            'filter-selected': this._filtersService.hasFilterSelected
                        }
                    }
                ]
            },
            {
                location: 'before',
                items: [
                    {
                        name: 'search',
                        widget: 'dxTextBox',
                        options: {
                            value: this.searchValue,
                            width: '279',
                            mode: 'search',
                            placeholder: this.l('Search') + ' ' + this.l('Users').toLowerCase(),
                            onValueChanged: (e) => {
                                this.searchValueChange(e);
                            }
                        }
                    }
                ]
            },
            {
                location: 'after',
                locateInMenu: 'auto',
                items: [
                    {
                        name: 'download',
                        widget: 'dxDropDownMenu',
                        options: {
                            hint: this.l('Download'),
                            items: [{
                                action: Function(),
                                text: this.l('Save as PDF'),
                                icon: 'pdf',
                            }, {
                                action: this.exportToExcel.bind(this),
                                text: this.l('Export to Excel'),
                                icon: 'xls',
                            }, {
                                action: this.exportToCSV.bind(this),
                                text: this.l('Export to CSV'),
                                icon: 'sheet'
                            }, {
                                action: this.exportToGoogleSheet.bind(this),
                                text: this.l('Export to Google Sheets'),
                                icon: 'sheet'
                            }, { type: 'downloadOptions' }]
                        }
                    },
                    { name: 'print', action: Function() }
                ]
            },
            {
                location: 'after',
                locateInMenu: 'auto',
                items: [
                    { name: 'showCompactRowsHeight', action: this.showCompactRowsHeight.bind(this) },
                    { name: 'columnChooser', action: this.showColumnChooser.bind(this) }
                ]
            },
            {
                location: 'after',
                locateInMenu: 'auto',
                items: [
                    {
                        name: 'fullscreen',
                        action: () => {
                            this.toggleFullscreen(document.documentElement);
                            setTimeout(() => this.dataGrid.instance.repaint(), 100);
                        }
                    }
                ]
            }
        ]);
    }

    openUserDetails(userId) {
        this.searchClear = false; 
        this.actionRecord = null;
        setTimeout(() => {
            this._router.navigate(['app/admin/user/' + userId + '/user-information'],
                { queryParams: { referrer: 'app/admin/users'} });
        }); 
    }

    initFilterConfig() {
        forkJoin(
            this._permissionService.getAllPermissions(),
            this._roleService.getRoles(undefined)
        ).subscribe((res) => {
            this._filtersService.setup(
                this.filters = [
                    new FilterModel({
                        component: FilterRadioGroupComponent,
                        caption: 'permission',
                        items: {
                            element: new FilterRadioGroupModel({
                                value: this.selectedPermission,
                                list: res[0].items.map((item) => {
                                    return {
                                        id: item.name,
                                        name: String.fromCharCode(160/*Space to avoid trim*/)
                                            .repeat(item.level * 5) + item.displayName,
                                        displayName: item.displayName
                                    };
                                })
                            })
                        }
                    }),
                    new FilterModel({
                        component: FilterRadioGroupComponent,
                        caption: 'role',
                        items: {
                            element: new FilterRadioGroupModel({
                                value: this.role,
                                list: res[1].items.map((item) => {
                                    return {
                                        id: item.id,
                                        name: item.displayName
                                    }
                                })
                            })
                        }
                    })
                ]
            );
        });

        this._filtersService.apply((filter) => {
            let filterValue = filter &&
                filter.items.element.value;
            if (filterValue) {
                if (filter.caption == 'role')
                    this.role = filterValue;
                else
                    this.selectedPermission = filterValue;
            }

            this.initToolbarConfig();
            this.invalidate();
        });
    }

    showCompactRowsHeight() {
        this.dataGrid.instance.element().classList.toggle('grid-compact-view');
    }

    showColumnChooser() {
        this.dataGrid.instance.showColumnChooser();
    }

    searchValueChange(e: object) {
        this.searchValue = e['value'];
        this.invalidate();
    }

    unlockUser(record): void {
        this._userServiceProxy.unlockUser(new EntityDtoOfInt64({ id: record.id })).subscribe(() => {
            this.notify.success(this.l('UnlockedTheUser', record.userName));
        });
    }

    invalidate(quietly = false) {
        if (this.dataGrid && this.dataGrid.instance)
            this.dataGrid.instance.option('loadPanel.enabled', !quietly);

        super.invalidate();
    }

    exportToExcel(): void {
        this._userServiceProxy.getUsersToExcel()
            .subscribe(result => {
                this._fileDownloadService.downloadTempFile(result);
            });
    }

    createUser(): void {
        this.dialog.open(CreateUserDialogComponent, {
            panelClass: 'slider',
            disableClose: true,
            closeOnNavigation: false,
            data: { refreshParent: this.invalidate.bind(this) }
        }).afterClosed().subscribe(() => this.invalidate());
    }

    deleteUser(user: UserListDto): void {
        if (user.userName === AppConsts.userManagement.defaultAdminUserName) {
            this.message.warn(this.l('{0}UserCannotBeDeleted', AppConsts.userManagement.defaultAdminUserName));
            return;
        }

        this.message.confirm(
            this.l('UserDeleteWarningMessage', user.userName),
            this.l('AreYouSure'),
            (isConfirmed) => {
                if (isConfirmed) {
                    this._userServiceProxy.deleteUser(user.id)
                        .subscribe(() => {
                            this.invalidate();
                            this.notify.success(this.l('SuccessfullyDeleted'));
                        });
                }
            }
        );
    }

    editUser(event) {
        if (this.permission.isGranted('Pages.Administration.Users.Edit')) {
            let userId = event.data && event.data.id;
            if (userId) {
                event.component.cancelEditData();
                this.openUserDetails(userId);
            }
        }
    }

    ngOnDestroy() {
        this.deactivate();
    }

    activate() {
        super.activate();

        this.paramsSubscribe();
        this.initFilterConfig();
        this.initToolbarConfig();

        this.rootComponent = this.getRootComponent();
        this.rootComponent.overflowHidden(true);

        this.showHostElement();
    }

    deactivate() {
        super.deactivate();

        this._filtersService.localizationSourceName =
            AppConsts.localization.defaultLocalizationSourceName;

        this.subRouteParams.unsubscribe();
        this._appService.updateToolbar(null);
        this._filtersService.unsubscribe();
        this.rootComponent.overflowHidden();

       this.hideHostElement();
    }

    private paramsSubscribe() {
        if (!this.subRouteParams || this.subRouteParams.closed)
            this.subRouteParams = this._activatedRoute.queryParams
                .subscribe(params => {
                    if (params['refresh'])
                        this.invalidate();
                });
    }

    onContentReady(event) {
        this.setGridDataLoaded();
    }

    showActionsMenu(event) {
        this.actionRecord = event.data;
        event.cancel = true;
    }

    onMenuItemClick($event) {
        $event.itemData.action.call(this);
        this.actionRecord = null;
    }

    onShowingPopup(e) {
        e.component.option('visible', false);
        e.component.hide();
    }
}
