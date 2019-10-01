/** Core imports */
import { AfterViewInit, Component, Injector, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Params } from '@angular/router';

/** Third party imports */
import DataSource from 'devextreme/data/data_source';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import { MatDialog } from '@angular/material/dialog';
import { takeUntil } from 'rxjs/operators';

/** Application imports */
import { AppService } from '@app/app.service';
import { AppComponentBase } from '@shared/common/app-component-base';
import { LanguageServiceProxy } from '@shared/service-proxies/service-proxies';
import { FiltersService } from '@shared/filters/filters.service';
import { EditTextModalComponent } from './edit-text-modal.component';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { FilterModel } from '@shared/filters/models/filter.model';
import { FilterDropDownComponent } from '@shared/filters/dropdown/filter-dropdown.component';
import { FilterDropDownModel } from '@shared/filters/dropdown/filter-dropdown.model';
import { DataGridService } from '@app/shared/common/data-grid.service.ts/data-grid.service';

@Component({
    templateUrl: './language-texts.component.html',
    styleUrls: ['./language-texts.component.less'],
    animations: [appModuleAnimation()]
})
export class LanguageTextsComponent extends AppComponentBase implements AfterViewInit, OnInit, OnDestroy {
    @ViewChild(DxDataGridComponent) dataGrid: DxDataGridComponent;

    private rootComponent: any;
    dataSource: DataSource;
    public actionMenuItems: any;
    public actionRecord: any;
    public headlineConfig = {
        names: [ this.l('LanguageTexts') ],
        icon: 'flag',
        // onRefresh: this.refreshDataGrid.bind(this),
        toggleToolbar: this.toggleToolbar.bind(this),
        buttons: []
    };
    sourceNames = abp.localization.sources.filter(source => source.type === 'MultiTenantLocalizationSource').map(value => value.name);
    languages: abp.localization.ILanguageInfo[] = abp.localization.languages;
    defaultBaseLanguageName: string;
    defaultTargetLanguageName: string;
    defaultSourceName: string;
    defaultTargetValueFilter: string;
    searchText: string;
    private filtersValues = {
        sourceName: undefined,
        baseLanguageName: undefined,
        targetLanguageName: undefined,
        targetValueFilter: undefined
    };
    private filtersModels: FilterModel[];

    constructor(
        injector: Injector,
        private _languageService: LanguageServiceProxy,
        private _filtersService: FiltersService,
        private _dialog: MatDialog,
        private _appService: AppService
    ) {
        super(injector);
        this.rootComponent = this.getRootComponent();
        this.rootComponent.overflowHidden(true);
    }

    ngOnInit(): void {
        this._activatedRoute.params.pipe(takeUntil(this.destroy$)).subscribe((params: Params) => {
            this.filtersValues.baseLanguageName = this.defaultBaseLanguageName = params['baseLanguageName'] || abp.localization.currentLanguage.name;
            this.filtersValues.targetLanguageName = this.defaultTargetLanguageName = params['name'];
            this.filtersValues.sourceName = this.defaultSourceName = params['sourceName'] || 'Platform';
            this.filtersValues.targetValueFilter = this.defaultTargetValueFilter = params['targetValueFilter'] || 'ALL';
            this.searchText = params['filterText'] || '';
            this.setupFilters();
            this.initFilterConfig();
            this.filtersModels.forEach((filter: FilterModel) => filter.updateCaptions());
            this.initToolbarConfig();
        });
        this._filtersService.filtersValues$
            .pipe(takeUntil(this.destroy$))
            .subscribe(filtersValues => {
                this.filtersValues = { ...this.filtersValues, ...filtersValues };
                this.refreshDataGrid();
            });
    }

    toggleToolbar() {
        this._appService.toolbarToggle();
        setTimeout(() => this.dataGrid.instance.repaint(), 0);
    }

    ngAfterViewInit(): void {
        this.dataSource = new DataSource({
            key: 'id',
            load: (loadOptions) => {
                return this._languageService.getLanguageTexts(
                    loadOptions.take,
                    loadOptions.skip,
                    (loadOptions.sort || []).map((item) => {
                        return item.selector + ' ' + (item.desc ? 'DESC' : 'ASC');
                    }).join(','),
                    this.filtersValues.sourceName || this.defaultSourceName,
                    this.filtersValues.baseLanguageName || this.defaultBaseLanguageName,
                    this.filtersValues.targetLanguageName || this.defaultTargetLanguageName,
                    this.filtersValues.targetValueFilter || this.defaultTargetValueFilter,
                    this.searchText
                ).toPromise().then(response => {
                    return {
                        data: response.items,
                        totalCount: response.totalCount
                    };
                });
            }
        });
    }

    setupFilters() {
        this.filtersModels = [
            new FilterModel({
                component: FilterDropDownComponent,
                caption: 'baseLanguageName',
                items: {
                    baseLanguageName: new FilterDropDownModel({
                        displayElementExp: 'displayName',
                        valueElementExp: 'name',
                        elements: this.languages,
                        value: this.filtersValues.baseLanguageName,
                        filterField: 'baseLanguageName'
                    })
                }
            }),
            new FilterModel({
                component: FilterDropDownComponent,
                caption: 'targetLanguageName',
                items: {
                    targetLanguageName: new FilterDropDownModel({
                        displayElementExp: 'displayName',
                        valueElementExp: 'name',
                        elements: this.languages,
                        value: this.filtersValues.targetLanguageName,
                        filterField: 'targetLanguageName'
                    })
                }
            }),
            new FilterModel({
                component: FilterDropDownComponent,
                caption: 'sourceName',
                items: {
                    sourceName: new FilterDropDownModel({
                        elements: this.sourceNames,
                        filterField: 'sourceName',
                        value: this.filtersValues.sourceName
                    })
                }
            }),
            new FilterModel({
                component: FilterDropDownComponent,
                caption: 'targetValueFilter',
                items: {
                    targetValueFilter: new FilterDropDownModel({
                        elements: [
                            {
                                name: this.l('All'),
                                value: 'ALL'
                            },
                            {
                                name: this.l('EmptyOnes'),
                                value: 'Empty'
                            }
                        ],
                        displayElementExp: 'name',
                        valueElementExp: 'value',
                        value: this.filtersValues.targetValueFilter,
                        filterField: 'targetValueFilter'
                    })
                }
            })
        ];
    }

    initFilterConfig() {
        this._filtersService.setup(this.filtersModels);
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
                            value: this.searchText,
                            width: '279',
                            mode: 'search',
                            placeholder: this.l('Search') + ' ' + this.l('Texts').toLowerCase(),
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
                    { name: 'showCompactRowsHeight', action: DataGridService.showCompactRowsHeight.bind(this, this.dataGrid) },
                    { name: 'columnChooser', action: DataGridService.showColumnChooser.bind(this, this.dataGrid) }
                ]
            },
            {
                location: 'after',
                locateInMenu: 'auto',
                items: [
                    {
                        name: 'fullscreen',
                        action: () => {
                            this.fullScreenService.toggleFullscreen(document.documentElement);
                            setTimeout(() => this.dataGrid.instance.repaint(), 100);
                        }
                    }
                ]
            }
        ]);
    }

    applyFilters(): void {
        this._router.navigate(['app/admin/languages', this.filtersValues.targetLanguageName, 'texts', {
            sourceName: this.filtersValues.sourceName,
            baseLanguageName: this.filtersValues.baseLanguageName,
            targetValueFilter: this.filtersValues.targetValueFilter,
            filterText: this.searchText
        }]);
    }

    searchValueChange(e: object) {
        this.searchText = e['value'];
        this.refreshDataGrid();
    }

    refreshDataGrid() {
        if (this.dataGrid && this.dataGrid.instance)
            this.dataGrid.instance.refresh();
    }

    openEditTextLanguageModal(key?, baseValue?, targetValue?) {
        const dialogRef = this._dialog.open(EditTextModalComponent, {
            panelClass: 'slider',
            data: {
                baseLanguageName: this.filtersValues.baseLanguageName,
                targetLanguageName: this.filtersValues.targetLanguageName,
                sourceName: this.filtersValues.sourceName,
                key: key,
                baseValue: baseValue,
                targetValue: targetValue,
            }
        });
        dialogRef.componentInstance.modalSave.subscribe(() => {
            this.refreshDataGrid();
        });
    }

    ngOnDestroy() {
        this.rootComponent.overflowHidden();
        this._filtersService.unsubscribe();
        this._appService.updateToolbar(null);
    }
}
