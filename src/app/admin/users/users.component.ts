/** Core imports */
import { Component, Injector, ViewChild, OnDestroy } from '@angular/core';

/** Third party imports */
import { MatDialog } from '@angular/material/dialog';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import DataSource from 'devextreme/data/data_source';
import { forkJoin } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import * as _ from 'underscore';

/** Application imports */
import {
    UserServiceProxy, UserListDto, Int64EntityDto, RoleServiceProxy,
    PermissionServiceProxy, UserGroup
} from '@shared/service-proxies/service-proxies';
import { NotifyService } from '@abp/notify/notify.service';
import { AppConsts } from '@shared/AppConsts';
import { AppComponentBase } from '@shared/common/app-component-base';
import { TokenAuthServiceProxy } from '@shared/service-proxies/service-proxies';
import { CreateUserDialogComponent } from './create-user-dialog/create-user-dialog.component';
import { ImpersonationService } from './impersonation.service';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { FiltersService } from '@shared/filters/filters.service';
import { FilterModel } from '@shared/filters/models/filter.model';
import { FilterRadioGroupComponent } from '@shared/filters/radio-group/filter-radio-group.component';
import { FilterRadioGroupModel } from '@shared/filters/radio-group/filter-radio-group.model';
import { FilterTreeListComponent } from '@shared/filters/tree-list/tree-list.component';
import { FilterNullableRadioGroupModel } from '@shared/filters/radio-group/filter-nullable-radio-group.model';
import { FilterTreeListModel } from '@shared/filters/tree-list/tree-list.model';
import { AppService } from '@app/app.service';
import { ItemTypeEnum } from '@shared/common/item-details-layout/item-type.enum';
import { ItemDetailsService } from '@shared/common/item-details-layout/item-details.service';
import { AppPermissions } from '@shared/AppPermissions';
import { DataGridService } from '@app/shared/common/data-grid.service/data-grid.service';
import { HeadlineButton } from '@app/shared/common/headline/headline-button.model';

@Component({
    templateUrl: './users.component.html',
    styleUrls: ['./users.component.less'],
    animations: [appModuleAnimation()]
})
export class UsersComponent extends AppComponentBase implements OnDestroy {
    @ViewChild(DxDataGridComponent) dataGrid: DxDataGridComponent;

    //Filters
    private filters: FilterModel[];
    selectedPermissions: string[] = [];
    role: number;
    group = UserGroup.Employee;
    isActive = true;
    public actionMenuItems: any;
    public actionRecord: any;
    public headlineButtons: HeadlineButton[] = [
        {
            enabled: this.isGranted(AppPermissions.AdministrationUsersCreate),
            action: this.createUser.bind(this),
            label: this.l('CreateNewUser')
        }
    ];
    noPhotoUrl = AppConsts.imageUrls.noPhoto;
    private rootComponent: any;
    formatting = AppConsts.formatting;
    dataSource: DataSource;

    constructor(
        injector: Injector,
        public dialog: MatDialog,
        private appService: AppService,
        private filtersService: FiltersService,
        private userServiceProxy: UserServiceProxy,
        private notifyService: NotifyService,
        private tokenAuth: TokenAuthServiceProxy,
        private permissionService: PermissionServiceProxy,
        private roleService: RoleServiceProxy,
        private itemDetailsService: ItemDetailsService,
        public impersonationService: ImpersonationService
    ) {
        super(injector);
        this.actionMenuItems = [
            {
                text: this.l('LoginAsThisUser'),
                visible: this.permission.isGranted(AppPermissions.AdministrationUsersImpersonation),
                action: () => {
                    this.impersonationService.impersonate(this.actionRecord.id, this.appSession.tenantId);
                }
            },
            {
                text: this.l('Edit'),
                visible: this.permission.isGranted(AppPermissions.AdministrationUsersEdit),
                action: () => {
                    this.openUserDetails(this.actionRecord.id);
                }
            },
            {
                text: this.l('Unlock'),
                visible: this.permission.isGranted(AppPermissions.AdministrationUsersChangePermissionsAndRoles),
                action: () => {
                    this.unlockUser(this.actionRecord);
                }
            },
            {
                text: this.l('Delete'),
                visible: this.permission.isGranted(AppPermissions.AdministrationUsersDelete),
                action: () => {
                    this.deleteUser(this.actionRecord);
                }
            }
        ].filter(Boolean);

        this.dataSource = new DataSource({
            key: 'id',
            load: (loadOptions) => {
                this.isDataLoaded = false;
                return this.userServiceProxy.getUsers(
                    this.searchValue || undefined,
                    this.selectedPermissions || undefined,
                    this.role || undefined,
                    false,
                    this.group,
                    this.isActive,
                    (loadOptions.sort || []).map((item) => {
                        return item.selector + ' ' + (item.desc ? 'DESC' : 'ASC');
                    }).join(','), loadOptions.take || -1, loadOptions.skip
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

    repaintDataGrid(delay = 0) {
        setTimeout(() => this.dataGrid.instance.repaint(), delay);
    }

    initToolbarConfig() {
        this.appService.updateToolbar([
            {
                location: 'before', items: [
                    {
                        name: 'filters',
                        action: () => {
                            this.repaintDataGrid(1000);
                            this.filtersService.fixed = !this.filtersService.fixed;
                        },
                        options: {
                            checkPressed: () => {
                                return this.filtersService.fixed;
                            },
                            mouseover: () => {
                                this.filtersService.enable();
                            },
                            mouseout: () => {
                                if (!this.filtersService.fixed)
                                    this.filtersService.disable();
                            }
                        },
                        attr: {
                            'filter-selected': this.filtersService.hasFilterSelected
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
                location: 'before',
                items: [
                    {
                        name: 'searchAll',
                        action: this.searchAllClick.bind(this),
                        options: {
                            text: this.l('Search All')
                        },
                        attr: {
                            'filter-selected': ((this.searchValue && this.searchValue.length > 0) && (this.filtersService.hasFilterSelected || this.group || this.isActive != undefined)) ? true : false,
                            'custaccesskey': 'search-container'
                        }
                    }
                ]
            },
            {
                location: 'after',
                areItemsDependent: true,
                items: [
                    {
                        name: 'All',
                        widget: 'dxButton',
                        options: {
                            text: this.l('All'),
                            checkPressed: () => {
                                return !this.group;
                            }
                        },
                        action: () => {
                            this.filterByGroup(undefined);
                        }
                    },
                    {
                        name: 'Employees',
                        widget: 'dxButton',
                        options: {
                            text: this.l('Employees'),
                            checkPressed: () => {
                                return this.group == UserGroup.Employee;
                            }
                        },
                        action: () => {
                            this.filterByGroup(UserGroup.Employee);
                        }
                    },
                    {
                        name: 'Members',
                        widget: 'dxButton',
                        options: {
                            text: this.l('Members'),
                            checkPressed: () => {
                                return this.group == UserGroup.Member;
                            }
                        },
                        action: () => {
                            this.filterByGroup(UserGroup.Member);
                        }
                    },
                    {
                        name: 'Partners',
                        widget: 'dxButton',
                        options: {
                            text: this.l('Partners'),
                            checkPressed: () => {
                                return this.group == UserGroup.Partner;
                            }
                        },
                        action: () => {
                            this.filterByGroup(UserGroup.Partner);
                        }
                    }
                ]
            },
            {
                location: 'after',
                areItemsDependent: true,
                items: [
                    {
                        name: 'All',
                        widget: 'dxButton',
                        options: {
                            text: this.l('All'),
                            checkPressed: () => {
                                return this.isActive == undefined;
                            }
                        },
                        action: () => {
                            this.filterByIsActive(undefined);
                        }
                    },
                    {
                        name: 'Active',
                        widget: 'dxButton',
                        options: {
                            text: this.l('Active'),
                            checkPressed: () => {
                                return this.isActive;
                            }
                        },
                        action: () => {
                            this.filterByIsActive(true);
                        }
                    },
                    {
                        name: 'Inactive',
                        widget: 'dxButton',
                        options: {
                            text: this.l('Inactive'),
                            checkPressed: () => {
                                return this.isActive == false;
                            }
                        },
                        action: () => {
                            this.filterByIsActive(false);
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
                                action: this.exportToXLS.bind(this),
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
                    { name: 'columnChooser', action: DataGridService.showColumnChooser.bind(this, this.dataGrid) }
                ]
            }
        ]);
    }

    toggleCompactView() {
        DataGridService.toggleCompactRowsHeight(this.dataGrid);
    }

    searchAllClick() {
        this.filtersService.clearAllFilters();
        this.group = undefined;
        this.isActive = undefined;
        this.initToolbarConfig();
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
            this.permissionService.getAllPermissions(false),
            this.roleService.getRoles(undefined, undefined)
        ).subscribe((res) => {
            this.filtersService.setup(
                this.filters = [
                    new FilterModel({
                        component: FilterTreeListComponent,
                        caption: 'permission',
                        items: {
                            element: new FilterTreeListModel({
                                value: this.selectedPermissions,
                                list: res[0].items.map((item) => {
                                    return {
                                        id: item.name,
                                        parent: item.parentName,
                                        name: item.displayName,
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
                                    };
                                })
                            })
                        }
                    }),
                    new FilterModel({
                        component: FilterRadioGroupComponent,
                        caption: 'group',
                        items: {
                            element: new FilterRadioGroupModel({
                                value: this.group,
                                list: [UserGroup.Employee, UserGroup.Member, UserGroup.Partner].map((item) => {
                                    return {
                                        id: item,
                                        name: this.l(item)
                                    };
                                })
                            })
                        }
                    }),
                    new FilterModel({
                        component: FilterRadioGroupComponent,
                        caption: 'isActive',
                        items: {
                            element: new FilterNullableRadioGroupModel({
                                value: this.isActive,
                                list: [
                                    { id: true, name: this.l('Active')},
                                    { id: false, name: this.l('Inactive')}
                                ]
                            })
                        }
                    })
                ]
            );

            this.updateGroupFilter(this.group);
            this.updateIsActiveFilter(this.isActive);
        });

        this.filtersService.apply((filter) => {
            let filterValue = filter &&
                filter.items.element.value;

            if (filter) {
                if (filter.caption == 'role')
                    this.role = filterValue;
                else if (filter.caption == 'permission')
                    this.selectedPermissions = filterValue;
                else if (filter.caption == 'group')
                    this.group = filterValue;
                else if (filter.caption == 'isActive')
                    this.isActive = filterValue;
            }

            this.initToolbarConfig();
            this.invalidate();
        });
    }

    filterByGroup(group: UserGroup) {
        this.group = group;

        this.initToolbarConfig();
        this.updateGroupFilter(group);
    }

    updateGroupFilter(group: UserGroup) {
        this.updateFilter('group', group);
    }

    filterByIsActive(isActive: boolean) {
        this.isActive = isActive;

        this.initToolbarConfig();
        this.updateIsActiveFilter(isActive);
    }

    updateIsActiveFilter(isActive: boolean) {
        this.updateFilter('isActive', isActive);
    }

    updateFilter(caption: string, value: any) {
        this.dataGrid.export.fileName = value;
        let filterModel = _.findWhere(this.filters, { caption: caption });
        if (filterModel) {
            filterModel.isSelected = true;
            filterModel.items.element.value = value;
            this.filtersService.change(filterModel);
        }
    }

    searchValueChange(e: object) {
        this.searchValue = e['value'];
        this.initToolbarConfig();
        this.invalidate();
    }

    unlockUser(record): void {
        this.userServiceProxy.unlockUser(new Int64EntityDto({ id: record.id })).subscribe(() => {
            this.notify.success(this.l('UnlockedTheUser', record.userName));
        });
    }

    invalidate(quietly = false) {
        this.isDataLoaded = false;
        let grid = this.dataGrid && this.dataGrid.instance;
        grid && grid.option('loadPanel.enabled', !quietly);
        setTimeout(() => super.invalidate());
    }

    createUser(): void {
        this.dialog.open(CreateUserDialogComponent, {
            panelClass: 'slider',
            disableClose: true,
            closeOnNavigation: false,
            data: { refreshParent: this.invalidate.bind(this) }
        }).afterClosed().pipe(filter(Boolean)).subscribe(() => this.invalidate());
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
                    this.userServiceProxy.deleteUser(user.id)
                        .subscribe(() => {
                            this.invalidate();
                            this.notify.success(this.l('SuccessfullyDeleted'));
                        });
                }
            }
        );
    }

    editUser(event) {
        if (this.permission.isGranted(AppPermissions.AdministrationUsersEdit)) {
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

        this.registerToEvents();
    }

    deactivate() {
        super.deactivate();
        this.appService.updateToolbar(null);
        this.filtersService.unsubscribe();
        this.rootComponent.overflowHidden();
        this.itemDetailsService.setItemsSource(ItemTypeEnum.User, this.dataGrid.instance.getDataSource());
        this.hideHostElement();
    }

    private paramsSubscribe() {
        this._activatedRoute.queryParams
            .pipe(takeUntil(this.deactivate$))
            .subscribe(params => {
                if (params['refresh'])
                    this.invalidate();
            });
    }

    registerToEvents() {
        abp.event.on('profilePictureChanged', () => {
            this.dataGrid.instance.refresh();
        });
    }

    onContentReady() {
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
