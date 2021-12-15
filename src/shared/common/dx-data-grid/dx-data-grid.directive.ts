/** Core imports */
import {
    Directive,
    OnInit,
    OnDestroy,
    Renderer2,
    ViewContainerRef
} from '@angular/core';
import { Location } from '@angular/common';

/** Third party imports */
import { AppConsts } from '@shared/AppConsts';
import { ClipboardService } from 'ngx-clipboard';
import { NotifyService } from 'abp-ng2-module';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import { DateTimePipe } from '@shared/common/pipes/datetime/datetime.pipe';
import { on } from 'devextreme/events';

/** Application imports */
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { DataGridService } from '@app/shared/common/data-grid.service/data-grid.service';
import { CacheHelper } from '@shared/common/cache-helper/cache-helper';

@Directive({
    selector: 'dx-data-grid:not(.alone)'
})
export class DxDataGridDirective implements OnInit, OnDestroy {

    constructor(
        private dateTimePipe: DateTimePipe,
        private renderer: Renderer2,
        private ls: AppLocalizationService,
        private notifyService: NotifyService,
        private component: DxDataGridComponent,
        private clipboardService: ClipboardService,
        private cacheHelper: CacheHelper,
        private viewContainerRef: ViewContainerRef,
        private location: Location
    ) {
        this.clipboardIcon = this.renderer.createElement('i');
        this.clipboardIcon.addEventListener('click', this.copyToClipboard, true);
        this.renderer.addClass(this.clipboardIcon, 'save-to-clipboard');
    }
    private clipboardIcon;
    private dateCheckTimeout;
    private subscriptions = [];
    private exporting = false;
    private copyToClipboard = (event) => {
        this.clipboardService.copyFromContent(event.target.parentNode.innerText.trim());
        this.notifyService.info(this.ls.l('SavedToClipboard'));

        event.stopPropagation();
        event.preventDefault();
    }

    ngOnInit() {
        this.component.instance.option(
            'columnResizingMode', 'widget');

        this.initStateStoring();
        this.subscriptions.push(
            this.component.onInitialized.subscribe(event => {
                let stateInherit = this.component.instance.state;
                this.component.instance.state = (state?: any): void => {
                    stateInherit(state);
                    this.setForCheckDateCellColumn(event.component);
                };

                setTimeout(() =>
                    DataGridService.toggleCompactRowsHeight(this.component, true)
                );
                this.setForCheckDateCellColumn(event.component);
            }),
            this.component.onOptionChanged.subscribe(event => {
                if (event.name == 'dataSource' || event.name == 'summary')
                    this.setForCheckDateCellColumn(event.component);
            }),
            this.component.onCellHoverChanged.subscribe(event => {
                if (event.rowType == 'header') {
                    if (event.cellElement.classList.contains('dx-command-select'))
                        event.cellElement.setAttribute('title', this.ls.l(
                            event.component.option('selection.selectAllMode') === 'allPages' ? 'AffectAllPagesItems' : 'AffectOnPageItems'));
                } else if (event.rowType == 'data') {
                    if (event.eventType == 'mouseover') {
                        if (event.column.name == 'hiddenTime') {
                            let text = event.cellElement.querySelector('span');
                            if (!text) {
                                event.cellElement.innerHTML = '';
                                text = this.renderer.createElement('span');
                                this.renderer.appendChild(event.cellElement, text);
                            }
                            text.innerText = this.getDateFormatted(event.data[event.column.dataField], false);
                        }
                        if (event.cellElement.classList.contains('clipboard-holder'))
                            this.appendClipboardIcon(event.cellElement);
                        else
                            this.appendClipboardIcon(event.cellElement.querySelector('.clipboard-holder'));
                    }
                    if (event.eventType == 'mouseout') {
                        if (event.column.name == 'hiddenTime') {
                            let text = event.cellElement.querySelector('span');
                            text.innerText = event.value ? this.getDateFormatted(event.data[event.column.dataField]) : '';
                        }
                    }
                }
            }),
            this.component.onContentReady.subscribe(event => {
                let dataSource = event.component.getDataSource();
                if (dataSource)
                    event.element.classList[dataSource.group()
                        ? 'add' : 'remove']('show-group-panel');
            }),
            this.component.onCellPrepared.subscribe(event => {
                if (event.rowType == 'header') {
                    on(event.cellElement, 'dxdragstart', { timeout: 1000 }, () => {
                        event.element.classList.add('show-group-panel');
                    });
                    on(event.cellElement, 'dxdragend', { timeout: 0 }, () => {
                        setTimeout(() => {
                            if (!event.component.getDataSource().group())
                                event.element.classList.remove('show-group-panel');
                        }, 100);
                    });
                }
            }),
            this.component.onRowPrepared.subscribe(event => {
                if (event.rowType === 'group') {
                    const cellsSelectorsToHide = ['.dx-command-select', '.dx-command-edit'];
                    let columnsNumberToAdd = 0;
                    cellsSelectorsToHide.forEach((cellSelector: string) => {
                        const cell = event.rowElement.querySelector(cellSelector);
                        if (cell) {
                            cell.style.display = 'none';
                            columnsNumberToAdd += 1;
                        }
                    });
                    if (columnsNumberToAdd) {
                        const lastColumn = event.rowElement.querySelector('td[colspan]');
                        if (lastColumn) {
                            lastColumn.colSpan = +lastColumn.colSpan + columnsNumberToAdd;
                        }
                    }
                }
            }),
            this.component.onExporting.subscribe(() => {
                this.exporting = true;
            }),
            this.component.onExported.subscribe(() => {
                this.exporting = false;
            })
        );
    }

    initStateStoring() {
        let hint = this.component.instance.option('hint');
        this.component.instance.option('stateStoring', {
            enabled: true,
            ignoreColumnOptionNames: [],
            storageKey: this.cacheHelper.getCacheKey(
                [
                    this.getLocationPath(),
                    hint ? hint.toLowerCase().replace(/\s/g, '_') : undefined
                ].filter(Boolean).join('_'),
                'DataGridState'
            )
        });
    }

    getLocationPath() {
        return this.location.path().split('?').shift().replace(/\//g, '_');
    }

    setForCheckDateCellColumn(component) {
        clearTimeout(this.dateCheckTimeout);
        this.dateCheckTimeout = setTimeout(() => {
            this.checkInitDateCellColumn(component);
        }, 300);
    }

    checkInitDateCellColumn(component) {
        let columns = component.option('columns');
        if (columns) {
            columns.forEach(column => {
                if (column.cellTemplate == 'dateCell') {
                    this.initDateCellColumn(column, component);
                }
            });
        }
    }

    initDateCellColumn(column, component) {
        component.columnOption(column.dataField, 'name', 'hiddenTime');
        component.columnOption(column.dataField, 'minWidth', '190px');
        component.columnOption(column.dataField, 'cellTemplate', undefined);
        component.columnOption(column.dataField, 'cssClass', column.cssClass + ' clipboard-holder');
        component.columnOption(column.dataField, 'calculateCellValue', (data) => {
            return this.getDateFormatted(data[column.dataField], !this.exporting);
        });
    }

    getDateFormatted(value: string, withoutTime = true) {
        let date = value && this.dateTimePipe.transform(
            value, AppConsts.formatting.dateTimeMoment);
        if (withoutTime)
            date = date && date.split(' ').shift();
        return date || '';
    }

    appendClipboardIcon(elm) {
        if (elm && elm.innerText.trim() && !elm.querySelector('i'))
            this.renderer.appendChild(elm, this.clipboardIcon);
    }

    ngOnDestroy() {
        this.subscriptions.forEach(sub => sub.unsubscribe());
        this.clipboardIcon.removeEventListener('click', this.copyToClipboard);
        this.renderer.removeClass(this.clipboardIcon, 'save-to-clipboard');
        if (this.clipboardIcon.parentNode)
            this.renderer.removeChild(this.clipboardIcon.parentNode, this.clipboardIcon);
    }
}