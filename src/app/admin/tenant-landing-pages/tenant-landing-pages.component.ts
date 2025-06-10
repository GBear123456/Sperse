/** Core imports */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Injector, OnDestroy, OnInit, ViewChild } from '@angular/core';

/** Third party imports */
import { MatDialog } from '@angular/material/dialog';
import DataSource from 'devextreme/data/data_source';
import ODataStore from 'devextreme/data/odata/store';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';
import { KeysEnum } from '@shared/common/keys.enum/keys.enum';
import { FiltersService } from '@shared/filters/filters.service';
import { AppComponentBase } from '@shared/common/app-component-base';
import { AppService } from '@app/app.service';
import { FilterModel } from '@shared/filters/models/filter.model';
import { AppPermissions } from '@shared/AppPermissions';
import { DataGridService } from '@app/shared/common/data-grid.service/data-grid.service';
import { HeadlineButton } from '@app/shared/common/headline/headline-button.model';
import { ToolbarGroupModel } from '@app/shared/common/toolbar/toolbar.model';
import { ActionMenuService } from '@app/shared/common/action-menu/action-menu.service';
import { ActionMenuItem } from '@app/shared/common/action-menu/action-menu-item.interface';
import { TenantLandingPageDto } from './tenant-landing-page-dto.interface';
import { TenantLandingPageFields } from './tenant-landing-page-fields.enum';
import { TenantLandingPageModalComponent } from './tenant-landing-page-modal/tenant-landing-page-modal.component';

@Component({
    templateUrl: './tenant-landing-pages.component.html',
    styleUrls: ['./tenant-landing-pages.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TenantLandingPagesComponent extends AppComponentBase implements OnDestroy, OnInit {
    @ViewChild(DxDataGridComponent) dataGrid: DxDataGridComponent;

    private filters: FilterModel[];
    public actionMenuItems: ActionMenuItem[] = [
        {
            text: this.l('Edit'),
            class: 'edit',
            disabled: !this.permission.isGranted(AppPermissions.AdministrationTenantLandingPagesManage),
            action: () => {
                this.openEditDialog(this.actionRecord.TenantId);
            }
        }
    ];

    searchValue: string;
    public actionRecord: any;
    public headlineButtons: HeadlineButton[] = [
    ];

    private readonly dataSourceURI = 'TenantLandinPage';
    readonly tenantLandingPageFields: KeysEnum<TenantLandingPageDto> = TenantLandingPageFields;
    dataSource: DataSource;
    private rootComponent: any;
    toolbarConfig: ToolbarGroupModel[];

    constructor(
        injector: Injector,
        private filtersService: FiltersService,
        private dialog: MatDialog,
        private changeDetector: ChangeDetectorRef,
        public appService: AppService
    ) {
        super(injector);
        this.rootComponent = this.getRootComponent();
        this.rootComponent.overflowHidden(true);
        this.initToolbarConfig();
        this.initFilterConfig();

        this.dataSource = new DataSource({
            key: this.tenantLandingPageFields.TenantId,
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
                            this.tenantLandingPageFields.TenantId
                        ]
                    );
                    request.timeout = AppConsts.ODataRequestTimeoutMilliseconds;
                },
                errorHandler: (error) => {
                    setTimeout(() => this.isDataLoaded = true);
                }
            })
        });
    }

    ngOnInit() {
    }

    repaintDataGrid(delay = 0) {
        setTimeout(() => this.dataGrid.instance.repaint(), delay);
    }

    initToolbarConfig() {
        this.toolbarConfig = [
            //{
            //    location: 'before', items: [
            //        {
            //            name: 'filters',
            //            action: () => {
            //                this.repaintDataGrid(1000);
            //                this.filtersService.fixed = !this.filtersService.fixed;
            //            },
            //            options: {
            //                checkPressed: () => {
            //                    return this.filtersService.fixed;
            //                },
            //                mouseover: () => {
            //                    this.filtersService.enable();
            //                },
            //                mouseout: () => {
            //                    if (!this.filtersService.fixed)
            //                        this.filtersService.disable();
            //                }
            //            },
            //            attr: {
            //                'filter-selected': this.filtersService.hasFilterSelected
            //            }
            //        }
            //    ]
            //},
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
                            placeholder: this.l('Search') + ' ' + this.l('Tenants').toLowerCase(),
                            onValueChanged: (e) => {
                                this.searchValueChange(e);
                            }
                        }
                    },
                    {
                        name: 'title'
                    }
                ]
            },
            //{
            //    location: 'after',
            //    locateInMenu: 'auto',
            //    items: [
            //        {
            //            name: 'download',
            //            widget: 'dxDropDownMenu',
            //            options: {
            //                hint: this.l('Download'),
            //                items: [
            //                    {
            //                        action: this.exportToXLS.bind(this),
            //                        text: this.l('Export to Excel'),
            //                        icon: 'xls',
            //                    }, {
            //                        action: this.exportToCSV.bind(this),
            //                        text: this.l('Export to CSV'),
            //                        icon: 'sheet'
            //                    }, {
            //                        action: this.exportToGoogleSheet.bind(this),
            //                        text: this.l('Export to Google Sheets'),
            //                        icon: 'sheet'
            //                    }, { type: 'downloadOptions' }]
            //            }
            //        },
            //        { name: 'print', action: Function(), visible: false }
            //    ]
            //}
        ];
    }

    toggleColumnChooser() {
        DataGridService.showColumnChooser(this.dataGrid);
    }

    toggleCompactView() {
        DataGridService.toggleCompactRowsHeight(this.dataGrid);
    }

    initFilterConfig() {
        const anyFilterApplied = this.filtersService.setup(
            this.filters = [
            ]
        );
        if (anyFilterApplied) {
            this.initToolbarConfig();
        }

        this.filtersService.apply((filters: FilterModel[]) => {
            this.initToolbarConfig();
            this.processFilterInternal();
        });
    }

    processFilterInternal() {
        this.processODataFilter(this.dataGrid.instance, this.dataSourceURI, this.filters, filter => filter);
    }

    onInitialized(event) {
        event.component.columnOption('command:edit', {
            visibleIndex: -1
        });
    }

    toggleActionsMenu(event) {
        ActionMenuService.toggleActionMenu(event, this.actionRecord).subscribe((actionRecord) => {
            this.actionRecord = actionRecord;
            this.changeDetector.detectChanges();
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

    editLandingPage(event) {
        if (this.permission.isGranted(AppPermissions.AdministrationTenantLandingPagesManage)) {
            event.component.cancelEditData();
            if (event.data && event.data.TenantId)
                this.openEditDialog(event.data.TenantId);
        }
    }

    private openEditDialog(tenantId: number) {
        this.dialog.open(TenantLandingPageModalComponent, {
            panelClass: ['slider'],
            data: { tenantId: tenantId }
        }).afterClosed().subscribe(invalidate => {
            if (invalidate)
                this.invalidate();
        });
    }

    searchValueChange(e: object) {
        this.searchValue = e['value'];
        this.processFilterInternal();
    }

    ngOnDestroy() {
        this.rootComponent.overflowHidden();
    }
}
