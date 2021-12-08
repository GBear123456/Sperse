/** Core imports */
import { Component, Injector, OnDestroy, ViewChild } from '@angular/core';

/** Third party imports */
import { MatDialog } from '@angular/material/dialog';
import DataSource from 'devextreme/data/data_source';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';

/** Application imports */
import { AppService } from '@app/app.service';
import { FiltersService } from '@shared/filters/filters.service';
import { AbpSessionService } from '@abp/session/abp-session.service';
import { AppComponentBase } from '@shared/common/app-component-base';
import { ApplicationLanguageListDto, LanguageServiceProxy, SetDefaultLanguageInput } from '@shared/service-proxies/service-proxies';
import { CreateOrEditLanguageModalComponent } from './create-or-edit-language-modal/create-or-edit-language-modal.component';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { AppPermissions } from '@shared/AppPermissions';
import { DataGridService } from '@app/shared/common/data-grid.service/data-grid.service';
import { HeadlineButton } from '@app/shared/common/headline/headline-button.model';
import { ToolbarGroupModel } from '@app/shared/common/toolbar/toolbar.model';
import { ActionMenuItem } from '@app/shared/common/action-menu/action-menu-item.interface';
import { ActionMenuService } from '@app/shared/common/action-menu/action-menu.service';

@Component({
    templateUrl: './languages.component.html',
    styleUrls: ['./languages.component.less'],
    animations: [appModuleAnimation()]
})
export class LanguagesComponent extends AppComponentBase implements OnDestroy {
    @ViewChild(DxDataGridComponent) dataGrid: DxDataGridComponent;
    dataSource: DataSource = new DataSource({
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
    });;
    public actionMenuItems: ActionMenuItem[];
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
    toolbarConfig: ToolbarGroupModel[];

    constructor(
        injector: Injector,
        private languageService: LanguageServiceProxy,
        private filtersService: FiltersService,
        private sessionService: AbpSessionService,
        private dialog: MatDialog,
        public appService: AppService
    ) {
        super(injector);
        this.rootComponent = this.getRootComponent();
        this.rootComponent.overflowHidden(true);
        this.initToolbarConfig();
        this.actionMenuItems = [
            {
                text: this.l('Edit'),
                class: 'edit',
                visible: this.permission.isGranted(AppPermissions.AdministrationLanguagesEdit)  && this.appService.isHostTenant,
                action: () => {
                    this.openCreateOrEditLanguageModal(this.actionRecord.id);
                }
            },
            {
                text: this.l('ChangeTexts'),
                class: 'change-texts',
                visible: this.permission.isGranted(AppPermissions.AdministrationLanguagesChangeTexts),
                action: () => {
                    this.changeTexts(this.actionRecord);
                }
            },
            {
                text: this.l('SetAsDefaultLanguage'),
                class: 'set-as-default-language',
                visible: this.permission.isGranted(AppPermissions.AdministrationLanguagesChangeTexts),
                action: () => {
                    this.setAsDefaultLanguage(this.actionRecord);
                }
            },
            {
                text: this.l('Delete'),
                class: 'delete',
                visible: this.permission.isGranted(AppPermissions.AdministrationLanguagesDelete)  && this.appService.isHostTenant,
                action: () => {
                    this.deleteLanguage(this.actionRecord);
                }
            }
        ].filter(Boolean);
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

    initToolbarConfig() {
        this.toolbarConfig = [
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
            this.invalidate();
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
                        this.invalidate();
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

    ngOnDestroy() {
        this.rootComponent.overflowHidden();
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
            this.invalidate();
        });
    }

    onRowPrepared(e) {
        if (e.rowType === 'data' && e.data.name === this.defaultLanguageName) {
            e.rowElement.classList.add('default');
        }
    }

    onInitialized(event) {
        event.component.columnOption('command:edit', {
            visibleIndex: -1
        });
    }
}