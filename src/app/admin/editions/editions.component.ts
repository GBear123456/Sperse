/** Core imports */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Injector, OnDestroy, ViewChild } from '@angular/core';

/** Third party imports */
import { MatDialog } from '@angular/material/dialog';
import DataSource from 'devextreme/data/data_source';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import { filter } from 'rxjs/operators';

/** Application imports */
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { AppService } from '@app/app.service';
import { AppComponentBase } from '@shared/common/app-component-base';
import { EditionListDto, EditionServiceProxy } from '@shared/service-proxies/service-proxies';
import { CreateOrEditEditionModalComponent } from './create-or-edit-edition-modal/create-or-edit-edition-modal.component';
import { AppPermissions } from '@shared/AppPermissions';
import { DataGridService } from '@app/shared/common/data-grid.service/data-grid.service';
import { HeadlineButton } from '@app/shared/common/headline/headline-button.model';
import { ToolbarGroupModel } from '@app/shared/common/toolbar/toolbar.model';
import { ActionMenuItem } from '@app/shared/common/action-menu/action-menu-item.interface';
import { ActionMenuService } from '@app/shared/common/action-menu/action-menu.service';

@Component({
    templateUrl: './editions.component.html',
    styleUrls: [ '../../../shared/metronic/dropdown-menu.less', './editions.component.less' ],
    animations: [appModuleAnimation()],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class EditionsComponent extends AppComponentBase implements OnDestroy {
    @ViewChild(DxDataGridComponent) dataGrid: DxDataGridComponent;
    public actionMenuItems: ActionMenuItem[] = [
        {
            text: this.l('Edit'),
            class: 'edit',
            visible: this.permission.isGranted(AppPermissions.EditionsEdit),
            action: () => {
                this.openCreateOrEditDialog(this.actionRecord.id);
            }
        },
        {
            text: this.l('Delete'),
            class: 'delete',
            visible: this.permission.isGranted(AppPermissions.EditionsDelete),
            action: () => {
                this.deleteEdition(this.actionRecord);
            }
        }
    ].filter(Boolean);
    public actionRecord: any;
    dataSource: DataSource = new DataSource({
        key: 'id',
        load: () => {
            return this.editionService.getEditions().toPromise().then(response => {
                return {
                    data: response.items,
                    totalCount: response.items.length
                };
            });
        }
    });
    public headlineButtons: HeadlineButton[] = [
        {
            enabled: this.isGranted(AppPermissions.EditionsCreate),
            action: this.createEdition.bind(this),
            label: this.l('CreateNewEdition')
        }
    ];
    private rootComponent: any;
    toolbarConfig: ToolbarGroupModel[];

    constructor(
        injector: Injector,
        private editionService: EditionServiceProxy,
        private dialog: MatDialog,
        private changeDetectorRef: ChangeDetectorRef,
        public appService: AppService
    ) {
        super(injector);
        this.rootComponent = this.getRootComponent();
        this.rootComponent.overflowHidden(true);
        this.initToolbarConfig();
    }

    toggleToolbar() {
        setTimeout(() => this.dataGrid.instance.repaint(), 0);
    }

    initToolbarConfig() {
        this.toolbarConfig = [
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
                    { name: 'print', action: Function(), visible: false }
                ]
            }
        ];
    }

    toggleColumnChooser() {
        DataGridService.showColumnChooser(this.dataGrid);
    }

    toggleCompactRowHeight() {
        DataGridService.toggleCompactRowsHeight(this.dataGrid);
    }

    toggleFullScreen() {
        setTimeout(() => this.dataGrid.instance.repaint(), 100);
    }

    openCreateOrEditDialog(e?) {
        if (!e || e.rowType === 'data') {
            this.dialog.open(CreateOrEditEditionModalComponent, {
                panelClass: ['slider', 'edition-modal'],
                data: {
                    editionId: e && e.data.id
                }
            }).afterClosed().pipe(filter(Boolean)).subscribe(
                () => this.invalidate()
            );
        }
    }

    createEdition(): void {
        this.openCreateOrEditDialog();
    }

    toggleActionsMenu(event) {
        ActionMenuService.toggleActionMenu(event, this.actionRecord).subscribe((actionRecord) => {
            this.actionRecord = actionRecord;
            this.changeDetectorRef.detectChanges();
        });
    }

    onMenuItemClick($event) {
        $event.itemData.action.call(this);
        this.actionRecord = null;
        this.changeDetectorRef.detectChanges();
    }

    deleteEdition(edition: EditionListDto): void {
        this.message.confirm(
            this.l('EditionDeleteWarningMessage', edition.displayName),
            this.l('AreYouSure'),
            isConfirmed => {
                if (isConfirmed) {
                    this.editionService.deleteEdition(edition.id).subscribe(() => {
                        this.invalidate();
                    });
                }
            }
        );
    }

    onContentReady() {
        this.setGridDataLoaded();
        this.changeDetectorRef.detectChanges();
    }

    onInitialized(event) {
        event.component.columnOption('command:edit', {
            visibleIndex: -1
        });
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
}
