/** Core imports */
import { Component, Injector, ViewChild, OnDestroy } from '@angular/core';
import { Params } from '@angular/router';

/** Third party imports */
import { MatDialog } from '@angular/material/dialog';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import DataSource from 'devextreme/data/data_source';
import { forkJoin } from 'rxjs';
import { filter, takeUntil, finalize } from 'rxjs/operators';
import * as _ from 'underscore';

/** Application imports */
import {
    UserServiceProxy, UserListDto, EntityDtoOfInt64, RoleServiceProxy,
    PermissionServiceProxy, UserGroup, GetRolesInput
} from '@shared/service-proxies/service-proxies';
import { NotifyService } from 'abp-ng2-module';
import { ContactGroup } from '@shared/AppEnums';
import { AppConsts } from '@shared/AppConsts';
import { AppComponentBase } from '@shared/common/app-component-base';
import { TokenAuthServiceProxy } from '@shared/service-proxies/service-proxies';
import { CreateUserDialogComponent } from './create-user-dialog/create-user-dialog.component';
import { ImpersonationService } from './impersonation.service';
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
import { ToolbarGroupModel } from '@app/shared/common/toolbar/toolbar.model';
import { ActionMenuItem } from '@app/shared/common/action-menu/action-menu-item.interface';
import { ActionMenuService } from '@app/shared/common/action-menu/action-menu.service';
import {
    FlatPermissionWithLevelDto,
    ListResultDtoOfFlatPermissionWithLevelDto,
    RoleListDto,
    ListResultDtoOfRoleListDto
} from '@shared/service-proxies/service-proxies';
import { AppStoreService } from '@app/store/app-store.service';
import { ToolBarComponent } from '@app/shared/common/toolbar/toolbar.component';
import { ContactsHelper } from '@shared/crm/helpers/contacts-helper';

@Component({
    templateUrl: './users.component.html',
    styleUrls: ['./users.component.less']
})
export class UsersComponent extends AppComponentBase implements OnDestroy {
    @ViewChild(DxDataGridComponent) dataGrid: DxDataGridComponent;
    @ViewChild(ToolBarComponent) toolbar: ToolBarComponent;

    //Filters
    invalidateTimeout: any;
    private filters: FilterModel[];
    selectedPermissions: string[] = [];
    group = UserGroup.Employee;
    isActive = true;
    role: number;

    public actionMenuItems: ActionMenuItem[] = [
        {
            text: this.l('LoginAsThisUser'),
            visible: this.permission.isGranted(AppPermissions.AdministrationUsersImpersonation),
            class: 'login',
            action: () => {
                this.impersonationService.impersonate(this.actionRecord.id, this.appSession.tenantId);
            }
        },
        {
            text: this.l('Edit'),
            class: 'edit',
            visible: this.permission.isGranted(AppPermissions.AdministrationUsersEdit),
            action: () => {
                this.openUserDetails(this.actionRecord.id);
            }
        },
        {
            text: this.l('Unlock'),
            class: 'unlock',
            visible: this.permission.isGranted(AppPermissions.AdministrationUsersChangePermissionsAndRoles),
            action: () => {
                this.unlockUser(this.actionRecord);
            }
        },
        {
            text: this.l('Delete'),
            class: 'delete',
            visible: this.permission.isGranted(AppPermissions.AdministrationUsersDelete),
            action: () => {
                this.deleteUser(this.actionRecord);
            }
        }
    ].filter(Boolean);
    public actionRecord: any;
    public headlineButtons: HeadlineButton[] = [
        {
            enabled: this.isGranted(AppPermissions.AdministrationUsersCreate),
            action: this.createUser.bind(this),
            label: this.l('CreateNewUser')
        }
    ];

    isGalleryView: boolean = false;
    noPhotoUrl = AppConsts.imageUrls.noPhoto;
    formatting = AppConsts.formatting;
    dataSource: DataSource;
    toolbarConfig: ToolbarGroupModel[];
    totalErrorMsg: string;
    totalCount: number;

    constructor(
        injector: Injector,
        private appStoreService: AppStoreService,
        private filtersService: FiltersService,
        private userServiceProxy: UserServiceProxy,
        private notifyService: NotifyService,
        private tokenAuth: TokenAuthServiceProxy,
        private permissionService: PermissionServiceProxy,
        private roleService: RoleServiceProxy,
        private itemDetailsService: ItemDetailsService,
        public appService: AppService,
        public impersonationService: ImpersonationService,
        public dialog: MatDialog
    ) {
        super(injector);
        this.dataSource = new DataSource({
            key: 'id',
            load: (loadOptions) => {
                let sortOption = [];
                if (loadOptions.sort)
                    sortOption = loadOptions.sort instanceof Array 
                        ? loadOptions.sort : [loadOptions.sort];
                this.processUserCountRequest();
                return this.userServiceProxy.getUsers(
                    this.searchValue || undefined,
                    this.selectedPermissions || undefined,
                    this.role || undefined,
                    false,
                    this.group,
                    this.isActive,
                    sortOption.map(item => {
                        return item.selector + ' ' + (item.desc ? 'DESC' : 'ASC');
                    }).join(','),
                    loadOptions.take || -1, loadOptions.skip
                ).toPromise().then(response => {
                    this.dataSource['entities'] = (this.dataSource['entities'] || []).concat(response.items);
                    return response.items;
                });
            },
            totalCount: (loadOptions: any) => {
                return this.totalCount || loadOptions.take;
            }
        });

        this.activate();
    }

    processUserCountRequest() {
        if (!this.totalCount) {
            this.totalErrorMsg = this.totalCount = undefined;
            this.userServiceProxy.getUserCount(
                this.searchValue || undefined,
                this.selectedPermissions || undefined,
                this.role || undefined,
                false,
                this.group,
                this.isActive
            ).subscribe(totalCount => {
                this.dataSource['total'] = this.totalCount = totalCount;
                this.dataGrid.instance.repaint();
            }, (e: any) => {
                this.totalErrorMsg = this.l('AnHttpErrorOccured'); 
            });
        }
    }

    repaintDataGrid(delay = 0) {
        setTimeout(() => this.dataGrid.instance.repaint(), delay);
    }

    initToolbarConfig() {
        this.toolbarConfig = [
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
                            'filter-selected': (this.searchValue && this.searchValue.length > 0) && (this.filtersService.hasFilterSelected || this.group || this.isActive != undefined) ? true : false,
                            'custaccesskey': 'search-container'
                        }
                    }
                ]
            },
            {
                location: 'before',
                locateInMenu: 'auto',
                areItemsDependent: true,
                items: [
                    {
                        name: 'All',
                        widget: 'dxButton',
                        options: {
                            text: this.l('All'),
                            checkPressed: () => !this.group
                        },
                        action: () => {
                            this.filterByGroup(undefined);
                        }
                    }
                ].concat(Object.keys(UserGroup).map(key => {
                    return {
                        name: key,
                        widget: 'dxButton',
                        options: {
                            text: this.l(key + 's'),
                            checkPressed: () => {
                                return this.group == UserGroup[key];
                            }
                        },
                        action: () => {
                            this.filterByGroup(UserGroup[key]);
                        }
                    };
                }))
            },
            {
                location: 'center',
                areItemsDependent: true,
                locateInMenu: 'auto',
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
                    { name: 'print', action: Function(), visible: false }
                ]
            },
            {
                location: 'after',
                locateInMenu: 'auto',
                items: [
                    {
                        name: 'Gallery',
                        action: () => {
                            this.isGalleryView = !this.isGalleryView;
                        },
                        options: {
                            icon: 'image',
                            checkPressed: () => this.isGalleryView
                        }
                    }
                ]
            }
        ];
    }

    toggleColumnChooser() {
        DataGridService.showColumnChooser(this.dataGrid);
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
                { 
                    queryParams: { 
                        contactGroupId: ContactGroup.Employee,
                        referrer: 'app/admin/users'
                    } 
                }
            )
        });
    }

    initFilterConfig() {
        forkJoin(
            this.permissionService.getAllPermissions(false),
            this.roleService.getRoles(new GetRolesInput())
        ).subscribe(([permissions, roles]: [ListResultDtoOfFlatPermissionWithLevelDto, ListResultDtoOfRoleListDto]) => {
            this.setupFilters(permissions.items, roles.items);
        });

        this.filtersService.apply((filters: FilterModel[]) => {
            filters && filters.forEach((filter: FilterModel) => {
                let filterValue = filter && filter.items.element.value;
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
            });
            this.initToolbarConfig();
            this.invalidate();
        });
    }

    private setupFilters(permissions: FlatPermissionWithLevelDto[], roles: RoleListDto[]) {
        this.filtersService.setup(
            this.filters = [
                new FilterModel({
                    component: FilterTreeListComponent,
                    caption: 'permission',
                    items: {
                        element: new FilterTreeListModel({
                            value: this.selectedPermissions,
                            list: permissions.map((item: FlatPermissionWithLevelDto) => {
                                return {
                                    id: item.name,
                                    parent: item.parentName,
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
                            list: roles.map((item: RoleListDto) => {
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
            this.filtersService.change([filterModel]);
        }
    }

    searchValueChange(e: object) {
        this.searchValue = e['value'];
        this.invalidate();
    }

    unlockUser(record): void {
        this.userServiceProxy.unlockUser(new EntityDtoOfInt64({ id: record.id })).subscribe(() => {
            this.notify.success(this.l('UnlockedTheUser', record.userName));
        });
    }

    invalidate(quietly = false) {
        this.isDataLoaded = false;
        this.totalCount = undefined;
        let grid = this.dataGrid && this.dataGrid.instance;
        grid && grid.option('loadPanel.enabled', !quietly);
        clearTimeout(this.invalidateTimeout);
        this.invalidateTimeout = setTimeout(
            () => super.invalidate()
        );
    }

    createUser(): void {
        this.dialog.open(CreateUserDialogComponent, {
            panelClass: 'slider',
            disableClose: true,
            closeOnNavigation: false,
            data: {
                userGroup: this.group,
                refreshParent: this.invalidate.bind(this)
            }
        }).afterClosed().pipe(filter(Boolean)).subscribe(() => this.invalidate());
    }

    deleteUser(user: UserListDto): void {
        if (user.userName === AppConsts.userManagement.defaultAdminUserName) {
            this.message.warn(this.l('{0}UserCannotBeDeleted', AppConsts.userManagement.defaultAdminUserName));
            return;
        }

        ContactsHelper.showConfirmMessage(
            this.l('UserDeleteWarningMessage', user.userName),
            (isConfirmed: boolean, [ notifyUser ]: boolean[]) => {
                if (isConfirmed) {
                    this.userServiceProxy.deleteUser(user.id, notifyUser)
                        .subscribe(() => {
                            this.invalidate();
                            this.appStoreService.dispatchUserAssignmentsActions(Object.keys(ContactGroup), true);
                            this.notify.success(this.l('SuccessfullyDeleted'));
                        });
                }
            },
            [ { text: this.l('SendCancellationEmail'), visible: true, checked: false }],
            this.l('AreYouSure')
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
        this.showHostElement(() => {
            this.toolbar.toolbarComponent.instance.repaint();
        });
        this.registerToEvents();
    }

    deactivate() {
        super.deactivate();
        this.filtersService.unsubscribe();
        this.itemDetailsService.setItemsSource(ItemTypeEnum.User, this.dataSource);
        this.hideHostElement();
    }

    private paramsSubscribe() {
        this._activatedRoute.queryParams
            .pipe(takeUntil(this.deactivate$))
            .subscribe((params: Params) => {
                if (params['refresh'])
                    this.invalidate();
                if (params['filterText'] && AppConsts.regexPatterns.email.test(params['filterText'])) {
                    this.group = undefined;
                    this.isActive = undefined;
                    this.searchClear = false;
                    this.searchValue = params['filterText'];
                    this.invalidate();
                }
            });
    }

    registerToEvents() {
        abp.event.on('profilePictureChanged', () => {
            this.isDataLoaded = false;
            this.dataGrid.instance.refresh();
        });
    }

    onInitialized(event) {
        event.component.columnOption('command:edit', {
            visibleIndex: -1
        });
    }

    toggleActionsMenu(event) {
        ActionMenuService.toggleActionMenu(event, this.actionRecord).subscribe((actionRecord) => {
            this.actionRecord = actionRecord;
        });
    }

    onMenuItemClick($event) {
        $event.itemData.action.call(this);
        this.actionRecord = null;
    }

    onShowingPopup(e) {
        e.component.option('visible', false);
        e.component.hide();
    }
  
    getRolesTitle(list) {
        return list ? list.map(item => item.roleName).join(', ') : '';
    }
}
