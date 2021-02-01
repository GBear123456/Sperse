/** Core imports */
import { Component, Injector, OnDestroy, OnInit, ViewChild } from '@angular/core';

/** Third party imports */
import { MatDialog } from '@angular/material/dialog';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import { BehaviorSubject, Observable } from 'rxjs';
import { filter, takeUntil, finalize } from 'rxjs/operators';
import DataSource from '@root/node_modules/devextreme/data/data_source';
import ODataStore from 'devextreme/data/odata/store';

/** Application imports */
import { AppService } from '@app/app.service';
import { AppConsts } from '@shared/AppConsts';
import { AppComponentBase } from '@shared/common/app-component-base';
import { FiltersService } from '@shared/filters/filters.service';
import { FilterModel } from '@shared/filters/models/filter.model';
import { FilterItemModel } from '@shared/filters/models/filter-item.model';
import { FilterInputsComponent } from '@shared/filters/inputs/filter-inputs.component';
import { FilterCheckBoxesComponent } from '@shared/filters/check-boxes/filter-check-boxes.component';
import { FilterCheckBoxesModel } from '@shared/filters/check-boxes/filter-check-boxes.model';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { ContactsService } from '@app/crm/contacts/contacts.service';
import { UserManagementService } from '@shared/common/layout/user-management-list/user-management.service';
import { DataGridService } from '@app/shared/common/data-grid.service/data-grid.service';
import { AppPermissions } from '@shared/AppPermissions';
import { LifecycleSubjectsService } from '@shared/common/lifecycle-subjects/lifecycle-subjects.service';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { HeadlineButton } from '@app/shared/common/headline/headline-button.model';
import { ToolbarGroupModel } from '@app/shared/common/toolbar/toolbar.model';
import { ToolBarComponent } from '@app/shared/common/toolbar/toolbar.component';
import { FilterMultilineInputComponent } from '@root/shared/filters/multiline-input/filter-multiline-input.component';
import { FilterMultilineInputModel } from '@root/shared/filters/multiline-input/filter-multiline-input.model';
import { AddProductDialogComponent } from '@app/crm/contacts/subscriptions/add-subscription-dialog/add-product-dialog/add-product-dialog.component';
import { ProductDto } from '@app/crm/products/products-dto.interface';
import { KeysEnum } from '@shared/common/keys.enum/keys.enum';
import { ProductFields } from '@app/crm/products/products-fields.enum';
import { FilterHelpers } from '@app/crm/shared/helpers/filter.helper';

@Component({
    templateUrl: './products.component.html',
    styleUrls: [
        '../shared/styles/grouped-action-menu.less',
        './products.component.less'
    ],
    animations: [appModuleAnimation()],
    providers: [
        LifecycleSubjectsService
    ]
})
export class ProductsComponent extends AppComponentBase implements OnInit, OnDestroy {
    @ViewChild(DxDataGridComponent, { static: false }) dataGrid: DxDataGridComponent;
    @ViewChild(ToolBarComponent, { static: false }) toolbar: ToolBarComponent;

    private readonly dataSourceURI = 'Products';
    private rootComponent: any;
    private subRouteParams: any;
    private dependencyChanged = false;
    public headlineButtons: HeadlineButton[] = [
        {
            enabled: true,
            action: this.createProduct.bind(this),
            label: this.l('AddProduct')
        }
    ];

    permissions = AppPermissions;
    searchValue: string = this._activatedRoute.snapshot.queryParams.searchValue || '';
    totalCount: number;
    toolbarConfig: ToolbarGroupModel[];
    private filters: FilterModel[] = this.getFilters();
    rowsViewHeight: number;
    readonly productFields: KeysEnum<ProductDto> = ProductFields;
    dataStore = {
        key: this.productFields.Id,
        deserializeDates: false,
        url: this.getODataUrl(
            this.dataSourceURI
        ),
        version: AppConsts.ODataVersion,
        beforeSend: (request) => {
            request.headers['Authorization'] = 'Bearer ' + abp.auth.getToken();
            request.params.$select = DataGridService.getSelectFields(
                this.dataGrid, [this.productFields.Id]
            );
            request.timeout = AppConsts.ODataRequestTimeoutMilliseconds;
        }
    };

    constructor(
        injector: Injector,
        private filtersService: FiltersService,
        private lifeCycleSubjectsService: LifecycleSubjectsService,
        public appService: AppService,
        public dialog: MatDialog
    ) {
        super(injector);
        this.dataSource = new DataSource({store: new ODataStore(this.dataStore)});
    }

    ngOnInit() {
        this.activate();
    }

    toggleToolbar() {
        this.repaintDataGrid();
        this.filtersService.fixed = false;
        this.filtersService.disable();
        this.initToolbarConfig();
    }

    onContentReady(event) {
        this.setGridDataLoaded();
        if (!this.rowsViewHeight)
            this.rowsViewHeight = DataGridService.getDataGridRowsViewHeight();
    }

    onSelectionChanged($event) {
        this.initToolbarConfig();
    }

    invalidate() {
        if (this.dataGrid && this.dataGrid.instance)
            this.dependencyChanged = false;
        this.processFilterInternal();
    }

    createProduct() {
        const dialogData = {
            fullHeigth: true
        };
        this.dialog.open(AddProductDialogComponent, {
            panelClass: 'slider',
            disableClose: true,
            closeOnNavigation: false,
            data: dialogData
        }).afterClosed().subscribe(
            () => this.invalidate()
        );
    }

    onCardClick({entity, entityStageDataSource, loadMethod}) {

    }

    initFilterConfig() {
        if (this.filters) {
            this.filtersService.setup(this.filters);
            this.filtersService.checkIfAnySelected();
        } else {
            this.filtersService.setup(
                this.filters = this.getFilters()
            );
        }

        this.filtersService.apply(() => {
            this.initToolbarConfig();
            this.processFilterInternal();
        });
    }

    private getFilters() {
        return [
            new FilterModel({
                component: FilterInputsComponent,
                operator: 'startswith',
                caption: 'name',
                items: { Name: new FilterItemModel()}
            }),
            new FilterModel({
                component: FilterMultilineInputComponent,
                caption: 'Code',
                filterMethod: this.filtersService.filterByMultiline,
                field: 'Code',
                items: {
                    element: new FilterMultilineInputModel({
                        ls: this.localizationService,
                        name: 'Code'
                    })
                }
            })
        ];
    }

    initToolbarConfig() {
        this.toolbarConfig = [
            {
                location: 'before', items: [
                    {
                        name: 'filters',
                        action: () => {
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
                            placeholder: this.l('Search') + ' ' + this.l('Products').toLowerCase(),
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
                            items: [
                                {
                                    action: (options) => {
                                        this.exportToXLS(options);
                                    },
                                    text: this.l('Export to Excel'),
                                    icon: 'xls'
                                },
                                {
                                    action: this.exportToCSV.bind(this),
                                    text: this.l('Export to CSV'),
                                    icon: 'sheet'
                                },
                                {
                                    action: this.exportToGoogleSheet.bind(this),
                                    text: this.l('Export to Google Sheets'),
                                    icon: 'sheet'
                                },
                                {
                                    type: 'downloadOptions'
                                }
                            ]
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

    repaintDataGrid(delay = 0) {
        setTimeout(() => this.dataGrid.instance.repaint(), delay);
    }

    toggleCompactView() {
        DataGridService.toggleCompactRowsHeight(this.dataGrid, true);
    }

    searchValueChange(e: object) {
        if (this.searchValue != e['value']) {
            this.searchValue = e['value'];
            this.processFilterInternal();
        }
    }

    processFilterInternal() {
        this.processODataFilter(
            this.dataGrid.instance,
            this.dataSourceURI,
            this.filters,
            this.filtersService.getCheckCustom
        );
    }

    initDataSource() {
        this.setDataGridInstance();
    }

    setDataGridInstance() {
        let instance = this.dataGrid && this.dataGrid.instance;
        if (instance && !instance.option('dataSource')) {
            instance.option('dataSource', this.dataSource);
            this.startLoading();
        }
    }

    ngOnDestroy() {
        this.deactivate();
    }

    activate() {
        super.activate();
        this.lifeCycleSubjectsService.activate.next();
        this.initFilterConfig();
        this.initToolbarConfig();
        this.rootComponent = this.getRootComponent();
        this.rootComponent.overflowHidden(true);

        if (this.dependencyChanged)
            this.invalidate();

        this.showHostElement();
    }

    repaintToolbar() {
        if (this.toolbar) {
            this.toolbar.toolbarComponent.instance.repaint();
        }
    }

    deactivate() {
        super.deactivate();
        this.filtersService.unsubscribe();
        this.rootComponent.overflowHidden();
        this.showHostElement(() => {
            this.repaintToolbar();
        });
    }
}