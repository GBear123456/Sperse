/** Core imports */
import { Component,  Injector, ViewChild, OnDestroy } from '@angular/core';

/** Third party imports */
import { MatDialog } from '@angular/material/dialog';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import DataSource from 'devextreme/data/data_source';
import values from 'lodash/values';

/** Application imports **/
import {
    PermissionServiceProxy,
    RoleServiceProxy,
    RoleListDto,
    ModuleType
} from '@shared/service-proxies/service-proxies';
import { AppComponentBase } from '@shared/common/app-component-base';
import { CreateOrEditRoleModalComponent } from './create-or-edit-role-modal/create-or-edit-role-modal.component';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { FiltersService } from '@shared/filters/filters.service';
import { FilterModel } from '@shared/filters/models/filter.model';
import { FilterRadioGroupComponent } from '@shared/filters/radio-group/filter-radio-group.component';
import { FilterRadioGroupModel } from '@shared/filters/radio-group/filter-radio-group.model';
import { AppConsts } from '@shared/AppConsts';
import { AppPermissions } from '@shared/AppPermissions';
import { DataGridService } from '@app/shared/common/data-grid.service/data-grid.service';
import { HeadlineButton } from '@app/shared/common/headline/headline-button.model';
import { ToolbarGroupModel } from '@app/shared/common/toolbar/toolbar.model';
import { AppService } from '@app/app.service';
import { ActionMenuItem } from '@app/shared/common/action-menu/action-menu-item.interface';
import { ActionMenuService } from '@app/shared/common/action-menu/action-menu.service';

@Component({
    templateUrl: './roles.component.html',
    styleUrls: ['./roles.component.less'],
    animations: [appModuleAnimation()]
})
export class RolesComponent extends AppComponentBase implements OnDestroy {
    @ViewChild(DxDataGridComponent) dataGrid: DxDataGridComponent;

    private filters: FilterModel[];
    private selectedPermission: string;
    private selectedModule: ModuleType;
    private rootComponent: any;
    public formatting = AppConsts.formatting;
    public actionMenuItems: ActionMenuItem[];
    public actionRecord: any;
    public headlineButtons: HeadlineButton[] = [
        {
            enabled: this.isGranted(AppPermissions.AdministrationRolesCreate),
            action: this.createRole.bind(this),
            label: this.l('CreateNewRole')
        }
    ];
    dataSource: any;
    permissionFilterModel: FilterModel;
    moduleFilterModel: FilterModel;
    toolbarConfig: ToolbarGroupModel[];

    constructor(
        injector: Injector,
        private roleService: RoleServiceProxy,
        private filtersService: FiltersService,
        private permissionService: PermissionServiceProxy,
        private dialog: MatDialog,
        public appService: AppService
    ) {
        super(injector);
        this.rootComponent = this.getRootComponent();
        this.rootComponent.overflowHidden(true);

        this.actionMenuItems = [
            {
                text: this.l('Edit'),
                visible: this.permission.isGranted(AppPermissions.AdministrationRolesEdit),
                class: 'edit',
                action: () => {
                    this.openCreateOrEditRoleModal(this.actionRecord.id);
                }
            },
            {
                text: this.l('Delete'),
                class: 'delete',
                visible: this.permission.isGranted(AppPermissions.AdministrationRolesDelete),
                action: () => {
                    this.deleteRole(this.actionRecord);
                }
            }
        ].filter(Boolean);

        this.initFilterConfig();
        this.initToolbarConfig();

        this.dataSource = new DataSource({
            key: 'id',
            load: () => {
                return this.roleService.getRoles(
                    this.selectedPermission,
                    this.selectedModule
                ).toPromise().then(response => {
                    return {
                        data: response.items,
                        totalCount: response.items.length
                    };
                });
            }
        });
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
                            placeholder: this.l('Search') + ' ' + this.l('Roles').toLowerCase(),
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
            }
        ];
    }

    toggleColumnChooser() {
        DataGridService.showColumnChooser(this.dataGrid);
    }

    toggleCompactView() {
        DataGridService.toggleCompactRowsHeight(this.dataGrid);
    }

    initFilterConfig() {
        this.permissionService.getAllPermissions(false).subscribe((res) => {
            this.filtersService.setup(
                this.filters = [
                    this.permissionFilterModel = new FilterModel({
                        component: FilterRadioGroupComponent,
                        caption: 'permission',
                        items: {
                            element: new FilterRadioGroupModel({
                                value: this.selectedPermission,
                                list: res.items.map(item => {
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
                    this.moduleFilterModel = new FilterModel({
                        component: FilterRadioGroupComponent,
                        caption: 'module',
                        items: {
                            element: new FilterRadioGroupModel({
                                value: this.selectedModule,
                                list: values(ModuleType).map(module => ({
                                    id: module,
                                    name: module,
                                    displayName: module
                                }))
                            })
                        }
                    })
                ]
            );
        });

        this.filtersService.apply(() => {
            this.selectedPermission = this.permissionFilterModel && this.permissionFilterModel.items.element.value;
            this.selectedModule = this.moduleFilterModel && this.moduleFilterModel.items.element.value;
            this.initToolbarConfig();
            this.invalidate();
        });
    }

    searchValueChange(e: object) {
        this.searchValue = e['value'];
        if (this.searchValue)
            this.dataGrid.instance.filter(['displayName', 'contains', this.searchValue]);
        else
            this.dataGrid.instance.clearFilter();
    }

    ngOnDestroy() {
        this.rootComponent.overflowHidden();
        this.filtersService.unsubscribe();
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

    createRole(): void {
        this.openCreateOrEditRoleModal();
    }

    editRole(event) {
        if (this.permission.isGranted(AppPermissions.AdministrationRolesEdit)) {
            let roleId = event.data && event.data.id;
            if (roleId) {
                event.component.cancelEditData();
                this.openCreateOrEditRoleModal(roleId);
            }
        }
    }

    openCreateOrEditRoleModal(roleId?: number) {
        const dialogRef = this.dialog.open(CreateOrEditRoleModalComponent, {
            panelClass: 'slider',
            data: {
                roleId: roleId
            }
        });
        dialogRef.componentInstance.modalSave.subscribe(() => {
            this.invalidate();
        });
    }

    deleteRole(role: RoleListDto): void {
        let self = this;
        self.message.confirm(
            self.l('RoleDeleteWarningMessage', role.displayName),
            this.l('AreYouSure'),
            isConfirmed => {
                if (isConfirmed) {
                    this.roleService.deleteRole(role.id).subscribe(() => {
                        this.invalidate();
                        abp.notify.success(this.l('SuccessfullyDeleted'));
                    });
                }
            }
        );
    }
}
