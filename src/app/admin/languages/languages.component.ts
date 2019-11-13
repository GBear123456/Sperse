/** Core imports */
import { Component, Injector, OnDestroy, ViewChild } from '@angular/core';

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
import { CreateOrEditLanguageModalComponent } from './create-or-edit-language-modal/create-or-edit-language-modal.component';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { AppPermissions } from '@shared/AppPermissions';
import { DataGridService } from '@app/shared/common/data-grid.service.ts/data-grid.service';
import { HeadlineButton } from '@app/shared/common/headline/headline-button.model';

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
    public headlineButtons: HeadlineButton[] = [
        {
            enabled: this.isGranted(AppPermissions.AdministrationLanguagesCreate) && this.appService.isHostTenant,
            action: this.createNewLanguage.bind(this),
            label: this.l('CreateNewLanguage')
        }
    ];
    defaultLanguageName: string;
    private rootComponent: any;

    constructor(
        injector: Injector,
        private languageService: LanguageServiceProxy,
        private filtersService: FiltersService,
        private appService: AppService,
        private sessionService: AbpSessionService,
        private dialog: MatDialog
    ) {
        super(injector);
        this.rootComponent = this.getRootComponent();
        this.rootComponent.overflowHidden(true);

        this.dataSource = new DataSource({
            key: 'id',
            load: () => {
                return this.languageService.getLanguages().toPromise().then(response => {
                    this.defaultLanguageName = response.defaultLanguageName;
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
                visible: this.permission.isGranted(AppPermissions.AdministrationLanguagesEdit)  && this.appService.isHostTenant,
                action: () => {
                    this.openCreateOrEditLanguageModal(this.actionRecord.id);
                }
            },
            {
                text: this.l('ChangeTexts'),
                visible: this.permission.isGranted(AppPermissions.AdministrationLanguagesChangeTexts),
                action: () => {
                    this.changeTexts(this.actionRecord);
                }
            },
            {
                text: this.l('SetAsDefaultLanguage'),
                visible: this.permission.isGranted(AppPermissions.AdministrationLanguagesChangeTexts),
                action: () => {
                    this.setAsDefaultLanguage(this.actionRecord);
                }
            },
            {
                text: this.l('Delete'),
                visible: this.permission.isGranted(AppPermissions.AdministrationLanguagesDelete)  && this.appService.isHostTenant,
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
        this.appService.updateToolbar([
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

    repaintDataGrid(delay = 0) {
        setTimeout(() => this.dataGrid.instance.repaint(), delay);
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
        this.languageService.setDefaultLanguage(input).subscribe(() => {
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
                    this.languageService.deleteLanguage(language.id).subscribe(() => {
                        this.refreshDataGrid();
                        this.notify.success(this.l('SuccessfullyDeleted'));
                    });
                }
            }
        );
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
        this.appService.updateToolbar(null);
    }

    sortLanguages = (item1, item2) => {
        return item1 === this.defaultLanguageName ? -1 : (item2 === this.defaultLanguageName ? 1 : 0);
    }

    openCreateOrEditLanguageModal(languageId?: number) {
        const dialogRef = this.dialog.open(CreateOrEditLanguageModalComponent, {
            panelClass: 'slider',
            data: {
                languageId: languageId
            }
        });
        dialogRef.componentInstance.modalSave.subscribe(() => {
            this.refreshDataGrid();
        });
    }

    onRowPrepared(e) {
        if (e.rowType === 'data' && e.data.name === this.defaultLanguageName) {
            e.rowElement.classList.add('default');
        }
    }
}
