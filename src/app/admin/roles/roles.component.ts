import { Component,  Injector, ViewChild, OnDestroy } from '@angular/core';
import { PermissionServiceProxy, RoleServiceProxy, RoleListDto } from '@shared/service-proxies/service-proxies';
import { NotifyService } from '@abp/notify/notify.service';
import { AppComponentBase } from '@shared/common/app-component-base';
import { FileDownloadService } from '@shared/utils/file-download.service';
import { CreateOrEditRoleModalComponent } from './create-or-edit-role-modal.component';
import { appModuleAnimation } from '@shared/animations/routerTransition';

import { DxDataGridComponent } from 'devextreme-angular';
import DataSource from 'devextreme/data/data_source';

import { FiltersService } from '@shared/filters/filters.service';
import { FilterModel } from '@shared/filters/models/filter.model';
import { FilterItemModel } from '@shared/filters/models/filter-item.model';
import { FilterRadioGroupComponent } from '@shared/filters/radio-group/filter-radio-group.component';
import { FilterRadioGroupModel } from '@shared/filters/radio-group/filter-radio-group.model';

import { AppService } from '@app/app.service';
import { AppConsts } from '@shared/AppConsts';

@Component({
    templateUrl: './roles.component.html',
    styleUrls: ['./roles.component.less'],
    animations: [appModuleAnimation()]
})
export class RolesComponent extends AppComponentBase implements OnDestroy {
    @ViewChild('createOrEditRoleModal') createOrEditRoleModal: CreateOrEditRoleModalComponent;
    @ViewChild(DxDataGridComponent) dataGrid: DxDataGridComponent;

    private filters: FilterModel[];
    selectedPermission = '';
    private rootComponent: any;
    private formatting = AppConsts.formatting;

    public actionMenuItems: any;
    public actionRecord: any;
    public headlineConfig = {
        names: [this.l('Roles')],
        icon: 'people',
        onRefresh: this.refreshDataGrid.bind(this),
        buttons: [
            {
                enabled: this.isGranted('Pages.Administration.Roles.Create'),
                action: this.createRole.bind(this),
                lable: this.l('CreateNewRole')
            }
        ]
    };

    dataSource: any;

    constructor(
        injector: Injector,
        private _roleService: RoleServiceProxy,
        private _notifyService: NotifyService,
        private _appService: AppService,
        private _filtersService: FiltersService,
        private _permissionService: PermissionServiceProxy,
        private _fileDownloadService: FileDownloadService
    ) {
        super(injector);
        this.rootComponent = this.getRootComponent();
        this.rootComponent.overflowHidden(true);

        this.actionMenuItems = [
            { 
                text: this.l('Edit'),
                visible: this.permission.isGranted('Pages.Administration.Roles.Edit'),
                action: () => {
                    this.createOrEditRoleModal.show(this.actionRecord.id);
                }
            },
            { 
                text: this.l('Delete'),
                visible: this.permission.isGranted('Pages.Administration.Roles.Delete'),
                action: () => {
                    this.deleteRole(this.actionRecord);
                }
            }
        ].filter(Boolean);

        this.initFilterConfig();
        this.initToolbarConfig();

        this.dataSource = new DataSource({
                key: 'id',
                load: (loadOptions) => {
                    return this._roleService.getRoles(
                            this.selectedPermission || undefined
                        ).toPromise().then(response => {
                            return {
                                data: response.items,
                                totalCount: response.items.length
                            };
                        });                    
                }
        });
    }

    initToolbarConfig() {
        this._appService.toolbarConfig = [
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
                location: 'after', items: [
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
                items: [
                    { name: 'showCompactRowsHeight', action: this.showCompactRowsHeight.bind(this) },
                    { name: 'columnChooser', action: this.showColumnChooser.bind(this) }
                ]
            },
            {
                location: 'after',
                items: [
                    { name: 'fullscreen', action: Function() }
                ]
            }
        ];
    }

    initFilterConfig() {
        this._permissionService.getAllPermissions().subscribe((res) => {
            this._filtersService.setup(
                this.filters = [
                    new FilterModel({
                        component: FilterRadioGroupComponent,
                        caption: 'permission',
                        items: { 
                            element: new FilterRadioGroupModel({
                                value: this.selectedPermission,
                                list: res.items.map((item) => {
                                    return {
                                        id: item.name,
                                        name: '-'.repeat(item.level * 2) + item.displayName,
                                        displayName: item.name
                                    };
                                })
                            })                        
                        }
                    })
                ]
            );
        });

        this._filtersService.apply((filter) => {
            this.selectedPermission = filter.items.element.value;

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
        this._filtersService.localizationSourceName = 
            AppConsts.localization.defaultLocalizationSourceName;
        this._appService.toolbarConfig = null;
        this._filtersService.unsubscribe();
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

    createRole(): void {
        this.createOrEditRoleModal.show();
    }

    editRole(event) {
        if (this.permission.isGranted('Pages.Administration.Roles.Edit')) {
            let roleId = event.data && event.data.id;
            if (roleId) {
                event.component.cancelEditData();
                this.createOrEditRoleModal.show(roleId);
            }
        }
    }

    deleteRole(role: RoleListDto): void {
        let self = this;
        self.message.confirm(
            self.l('RoleDeleteWarningMessage', role.displayName),
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