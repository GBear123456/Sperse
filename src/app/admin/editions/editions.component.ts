/** Core imports */
import { Component, Injector, OnDestroy, ViewChild } from '@angular/core';

/** Third party imports */
import DataSource from 'devextreme/data/data_source';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';

/** Application imports */
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { AppService } from '@app/app.service';
import { AppComponentBase } from '@shared/common/app-component-base';
import { EditionListDto, EditionServiceProxy } from '@shared/service-proxies/service-proxies';
import { CreateOrEditEditionModalComponent } from './create-or-edit-edition-modal.component';
import { AppConsts } from '@shared/AppConsts';

@Component({
    templateUrl: './editions.component.html',
    styleUrls: [ '../../../shared/metronic/dropdown-menu.less', './editions.component.less' ],
    animations: [appModuleAnimation()]
})
export class EditionsComponent extends AppComponentBase implements OnDestroy {
    @ViewChild(DxDataGridComponent) dataGrid: DxDataGridComponent;
    @ViewChild('createOrEditEditionModal') createOrEditEditionModal: CreateOrEditEditionModalComponent;
    public actionMenuItems: any;
    public actionRecord: any;
    dataSource: DataSource;
    public headlineConfig = {
        names: [this.l('Products')],
        icon: '',
        onRefresh: this.refreshDataGrid.bind(this),
        buttons: [
            {
                enabled: this.isGranted('Pages.Editions.Create'),
                action: this.createEdition.bind(this),
                lable: this.l('CreateNewEdition')
            }
        ]
    };
    private rootComponent: any;

    constructor(
        injector: Injector,
        private _appService: AppService,
        private _editionService: EditionServiceProxy
    ) {
        super(injector);
        this.rootComponent = this.getRootComponent();
        this.rootComponent.overflowHidden(true);
        this.initToolbarConfig();

        this.dataSource = new DataSource({
            key: 'id',
            load: () => {
                return  this._editionService.getEditions().toPromise().then(response => {
                    return {
                        data: response.items,
                        totalCount: response.items.length
                    };
                });
            }
        });

        this.actionMenuItems = [
            {
                text: this.l('Edit'),
                visible: this.permission.isGranted('Pages.Editions.Edit'),
                action: () => {
                    this.createOrEditEditionModal.show(this.actionRecord.id);
                }
            },
            {
                text: this.l('Delete'),
                visible: this.permission.isGranted('Pages.Editions.Delete'),
                action: () => {
                    this.deleteEdition(this.actionRecord);
                }
            }
        ].filter(Boolean);
    }

    initToolbarConfig() {
        this._appService.updateToolbar([
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
                            placeholder: this.l('Search') + ' ' + this.l('Products').toLowerCase() + ' by name',
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

    createEdition(): void {
        this.createOrEditEditionModal.show();
    }

    refreshDataGrid() {
        if (this.dataGrid && this.dataGrid.instance)
            this.dataGrid.instance.refresh();
    }

    showActionsMenu(event) {
        this.actionRecord = event.data;
        event.cancel = true;
    }

    onMenuItemClick($event) {
        $event.itemData.action.call(this);
        this.actionRecord = null;
    }

    deleteEdition(edition: EditionListDto): void {
        this.message.confirm(
            this.l('EditionDeleteWarningMessage', edition.displayName),
            this.l('AreYouSure'),
            isConfirmed => {
                if (isConfirmed) {
                    this._editionService.deleteEdition(edition.id).subscribe(() => {
                        this.refreshDataGrid();
                    });
                }
            }
        );
    }

    onContentReady() {
        this.setGridDataLoaded();
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

    ngOnDestroy() {
        this.rootComponent.overflowHidden();
        this._appService.updateToolbar(null);
    }
}
