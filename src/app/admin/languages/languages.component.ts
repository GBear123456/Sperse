/** Core imports */
import { Component, ElementRef, Injector, OnDestroy, ViewChild } from '@angular/core';

/** Third party imports */
import DataSource from 'devextreme/data/data_source';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import { DxTooltipComponent } from 'devextreme-angular/ui/tooltip';
import { MatDialog } from '@angular/material';

/** Application imports */
import { AppService } from '@app/app.service';
import { FiltersService } from '@shared/filters/filters.service';
import { AbpSessionService } from '@abp/session/abp-session.service';
import { AppComponentBase } from '@shared/common/app-component-base';
import { ApplicationLanguageListDto, LanguageServiceProxy, SetDefaultLanguageInput } from '@shared/service-proxies/service-proxies';
import { CreateOrEditLanguageModalComponent } from './create-or-edit-language-modal.component';
import { appModuleAnimation } from '@shared/animations/routerTransition';


@Component({
    templateUrl: './languages.component.html',
    styleUrls: ['./languages.component.less'],
    animations: [appModuleAnimation()]
})
export class LanguagesComponent extends AppComponentBase implements OnDestroy {
    @ViewChild(DxDataGridComponent) dataGrid: DxDataGridComponent;
    @ViewChild(DxTooltipComponent) tooltip: DxTooltipComponent;
    dataSource: DataSource;
    public actionMenuItems: any;
    public actionRecord: any;
    public headlineConfig = {
        names: [this.l('Languages')],
        icon: 'flag',
        onRefresh: this.refreshDataGrid.bind(this),
        buttons: [
            {
                enabled: this.isGranted('Pages.Administration.Languages.Create'),
                action: this.createNewLanguage.bind(this),
                lable: this.l('CreateNewLanguage')
            }
        ]
    };

    defaultLanguageName: string;
    private rootComponent: any;

    constructor(
        injector: Injector,
        private _languageService: LanguageServiceProxy,
        private _filtersService: FiltersService,
        private _appService: AppService,
        private _sessionService: AbpSessionService,
        private _dialog: MatDialog
    ) {
        super(injector);
        this.rootComponent = this.getRootComponent();
        this.rootComponent.overflowHidden(true);

        this.dataSource = new DataSource({
            key: 'id',
            load: () => {
                return this._languageService.getLanguages(
                ).toPromise().then(response => {
                    return {
                        data: response.items,
                        totalCount: response.items.length,
                        defaultLanguageName: response.defaultLanguageName
                    };
                });
            }
        });

        this.initToolbarConfig();

        this.actionMenuItems = [
            {
                text: this.l('Edit'),
                visible: this.permission.isGranted('Pages.Administration.Languages.Edit'),
                action: () => {
                    this.openCreateOrEditLanguageModal(this.actionRecord.id);
                }
            },
            {
                text: this.l('ChangeTexts'),
                visible: this.permission.isGranted('Pages.Administration.Languages.ChangeTexts'),
                action: () => {
                    this.changeTexts(this.actionRecord);
                }
            },
            {
                text: this.l('SetAsDefaultLanguage'),
                visible: this.permission.isGranted('Pages.Administration.Languages.Edit'),
                action: () => {
                    this.setAsDefaultLanguage(this.actionRecord);
                }
            },
            {
                text: this.l('Delete'),
                visible: this.permission.isGranted('Pages.Administration.Languages.Delete'),
                action: () => {
                    this.deleteLanguage(this.actionRecord);
                }
            }
        ].filter(Boolean);
    }

    showActionsMenu(event) {
        this.actionRecord = event.data;
        event.cancel = true;
    }

    onMenuItemClick($event) {
        $event.itemData.action.call(this);
        this.actionRecord = null;
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

    createNewLanguage(): void {
        this.openCreateOrEditLanguageModal();
    }

    changeTexts(language: ApplicationLanguageListDto): void {
        this._router.navigate(['app/admin/languages', language.name, 'texts']);
    }

    setAsDefaultLanguage(language: ApplicationLanguageListDto): void {
        const input = new SetDefaultLanguageInput();
        input.name = language.name;
        this._languageService.setDefaultLanguage(input).subscribe(() => {
            this.refreshDataGrid();
            this.notify.success(this.l('SuccessfullySaved'));
        });
    }

    deleteLanguage(language: ApplicationLanguageListDto): void {
        this.message.confirm(
            this.l('LanguageDeleteWarningMessage', language.displayName),
            this.l('AreYouSure'),
            isConfirmed => {
                if (isConfirmed) {
                    this._languageService.deleteLanguage(language.id).subscribe(() => {
                        this.refreshDataGrid();
                        this.notify.success(this.l('SuccessfullyDeleted'));
                    });
                }
            }
        );
    }

    get multiTenancySideIsHost(): boolean {
        return !this._sessionService.tenantId;
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
        this._appService.updateToolbar(null);
    }

    openCreateOrEditLanguageModal(languageId?: number) {
        const dialogRef = this._dialog.open(CreateOrEditLanguageModalComponent, {
            panelClass: 'slider',
            data: {
                languageId: languageId
            }
        });
        dialogRef.componentInstance.modalSave.subscribe(() => {
            this.refreshDataGrid();
        });
    }
}
