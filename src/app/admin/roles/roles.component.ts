/** Core imports */
import { Component,  Injector, ViewChild, OnDestroy } from '@angular/core';

/** Third party imports */
import { MatDialog } from '@angular/material';
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
import { CreateOrEditRoleModalComponent } from './create-or-edit-role-modal.component';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { FiltersService } from '@shared/filters/filters.service';
import { FilterModel } from '@shared/filters/models/filter.model';
import { FilterRadioGroupComponent } from '@shared/filters/radio-group/filter-radio-group.component';
import { FilterRadioGroupModel } from '@shared/filters/radio-group/filter-radio-group.model';
import { AppService } from '@app/app.service';
import { AppConsts } from '@shared/AppConsts';
import { AppPermissions } from '@shared/AppPermissions';

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
    private formatting = AppConsts.formatting;
    public actionMenuItems: any;
    public actionRecord: any;
    public headlineConfig = {
        names: [this.l('Roles')],
        icon: 'people',
        // onRefresh: this.refreshDataGrid.bind(this),
        toggleToolbar: this.toggleToolbar.bind(this),
        buttons: [
            {
                enabled: this.isGranted(AppPermissions.PagesAdministrationRolesCreate),
                action: this.createRole.bind(this),
                lable: this.l('CreateNewRole')
            }
        ]
    };
    dataSource: any;
    permissionFilterModel: FilterModel;
    moduleFilterModel: FilterModel;
    constructor(
        injector: Injector,
        private _roleService: RoleServiceProxy,
        private _appService: AppService,
        private _filtersService: FiltersService,
        private _permissionService: PermissionServiceProxy,
        private _dialog: MatDialog
    ) {
        super(injector);
        this.rootComponent = this.getRootComponent();
        this.rootComponent.overflowHidden(true);

        this.actionMenuItems = [
            {
                text: this.l('Edit'),
                visible: this.permission.isGranted(AppPermissions.PagesAdministrationRolesEdit),
                action: () => {
                    this.openCreateOrEditRoleModal(this.actionRecord.id);
                }
            },
            {
                text: this.l('Delete'),
                visible: this.permission.isGranted(AppPermissions.PagesAdministrationRolesDelete),
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
                return this._roleService.getRoles(
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

    toggleToolbar() {
        this._appService.toolbarToggle();
        setTimeout(() => this.dataGrid.instance.repaint(), 0);
    }

    initToolbarConfig() {
        this._appService.updateToolbar([
            {
                location: 'before', items: [
                    {
                        name: 'filters',
                        action: () => {
                            setTimeout(() => {
                                this.dataGrid.instance.repaint();
                            }, 1000);
                            this._filtersService.fixed = !this._filtersService.fixed;
                        },
                        options: {
                            checkPressed: () => {
                                return this._filtersService.fixed;
                            },
                            mouseover: () => {
                                this._filtersService.enable();
                            },
                            mouseout: () => {
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

    initFilterConfig() {
        this._permissionService.getAllPermissions(false).subscribe((res) => {
            this._filtersService.setup(
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

        this._filtersService.apply(() => {
            this.selectedPermission = this.permissionFilterModel && this.permissionFilterModel.items.element.value;
            this.selectedModule = this.moduleFilterModel && this.moduleFilterModel.items.element.value;
            this.initToolbarConfig();
            this.refreshDataGrid();
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
        this.initToolbarConfig();
        if (this.searchValue)
            this.dataGrid.instance.filter(['displayName', 'contains', this.searchValue]);
        else
            this.dataGrid.instance.clearFilter();
    }

    refreshDataGrid() {
        if (this.dataGrid && this.dataGrid.instance)
            this.dataGrid.instance.refresh();
    }

    ngOnDestroy() {
        this.rootComponent.overflowHidden();
        this._appService.updateToolbar(null);
        this._filtersService.unsubscribe();
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

    createRole(): void {
        this.openCreateOrEditRoleModal();
    }

    editRole(event) {
        if (this.permission.isGranted(AppPermissions.PagesAdministrationRolesEdit)) {
            let roleId = event.data && event.data.id;
            if (roleId) {
                event.component.cancelEditData();
                this.openCreateOrEditRoleModal(roleId);
            }
        }
    }

    openCreateOrEditRoleModal(roleId?: number) {
        const dialogRef = this._dialog.open(CreateOrEditRoleModalComponent, {
            panelClass: 'slider',
            data: {
                roleId: roleId
            }
        });
        dialogRef.componentInstance.modalSave.subscribe(() => {
            this.refreshDataGrid();
        });
    }

    deleteRole(role: RoleListDto): void {
        let self = this;
        self.message.confirm(
            self.l('RoleDeleteWarningMessage', role.displayName),
            this.l('AreYouSure'),
            isConfirmed => {
                if (isConfirmed) {
                    this._roleService.deleteRole(role.id).subscribe(() => {
                        this.refreshDataGrid();
                        abp.notify.success(this.l('SuccessfullyDeleted'));
                    });
                }
            }
        );
    }
}
