/** Core imports */
import { AfterViewInit, Component, ElementRef, Injector, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Params } from '@angular/router';

/** Third party imports */
import map from 'lodash/map';
import filter from 'lodash/filter';
import DataSource from 'devextreme/data/data_source';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import { MatDialog } from '@angular/material/dialog';

/** Application imports */
import { AppService } from '@app/app.service';
import { AppComponentBase } from '@shared/common/app-component-base';
import { LanguageServiceProxy } from '@shared/service-proxies/service-proxies';
import { FiltersService } from '@shared/filters/filters.service';
import { EditTextModalComponent } from './edit-text-modal.component';
import { appModuleAnimation } from '@shared/animations/routerTransition';

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
        names: [this.l('LanguageTexts')],
        icon: 'flag',
        onRefresh: this.refreshDataGrid.bind(this),
        buttons: []
    };

    sourceNames: string[] = [];
    languages: abp.localization.ILanguageInfo[] = [];
    targetLanguageName: string;
    sourceName: string;
    baseLanguageName: string;
    targetValueFilter: string;
    filterText: string;
    name: string;

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
        this.initToolbarConfig();
        this._activatedRoute.params.subscribe((params: Params) => {
            this.baseLanguageName = params['baseLanguageName'] || abp.localization.currentLanguage.name;
            this.targetLanguageName = params['name'];
            this.sourceName = params['sourceName'] || 'Platform';
            this.targetValueFilter = params['targetValueFilter'] || 'ALL';
            this.filterText = params['filterText'] || '';
        });
    }

    ngOnInit(): void {
        this.sourceNames = map(filter(abp.localization.sources, source => source.type === 'MultiTenantLocalizationSource'), value => value.name);
        this.languages = abp.localization.languages;
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
                    this.sourceName || this.name || undefined,
                    this.baseLanguageName || undefined,
                    this.targetLanguageName || undefined,
                    this.targetValueFilter,
                    this.filterText
                ).toPromise().then(response => {
                    return {
                        data: response.items,
                        totalCount: response.totalCount
                    };
                });
            }
        });
    }

    initToolbarConfig() {
        this._appService.updateToolbar([
            {
                location: 'before', items: [
                    {
                        name: 'filters',
                        disabled: true,
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
                            placeholder: this.l('Search') + ' ' + this.l('Languages').toLowerCase(),
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

    applyFilters(): void {
        this._router.navigate(['app/admin/languages', this.targetLanguageName, 'texts', {
            sourceName: this.sourceName,
            baseLanguageName: this.baseLanguageName,
            targetValueFilter: this.targetValueFilter,
            filterText: this.filterText
        }]);
    }

    truncateString(text): string {
        return abp.utils.truncateStringWithPostfix(text, 32, '...');
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

    openEditTextLanguageModal(baseLanguageName?, targetLanguageName?, sourceName?, key?, baseValue?, targetValue?) {
        const dialogRef = this._dialog.open(EditTextModalComponent, {
            panelClass: 'slider',
            data: {
                baseLanguageName: baseLanguageName,
                targetLanguageName: targetLanguageName,
                sourceName: sourceName,
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
        this._appService.updateToolbar(null);
    }
}
