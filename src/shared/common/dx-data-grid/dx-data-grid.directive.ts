/** Core imports */
import { Directive, OnInit, OnDestroy, Renderer2 } from '@angular/core';
import { DatePipe } from '@angular/common';

/** Third party imports */
import { AppConsts } from '@shared/AppConsts';
import { ClipboardService } from 'ngx-clipboard';
import { DateHelper } from '@shared/helpers/DateHelper';
import { NotifyService } from '@abp/notify/notify.service';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import { on } from 'devextreme/events';

/** Application imports */
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { DataGridService } from '@app/shared/common/data-grid.service/data-grid.service';

@Directive({
    selector: 'dx-data-grid',
    providers: [ DatePipe ]
})
export class DxDataGridDirective implements OnInit, OnDestroy {
    private clipboardIcon;
    private subscriptions = [];
    private timezone = DateHelper.getUserTimezone();
    private copyToClipboard = (event) => {
        this.clipboardService.copyFromContent(event.target.parentNode.innerText.trim());
        this.notifyService.info(this.ls.l('SavedToClipboard'));

        event.stopPropagation();
        event.preventDefault();
    }

    constructor(
        private datePipe: DatePipe,
        private renderer: Renderer2,
        private ls: AppLocalizationService,
        private notifyService: NotifyService,
        private component: DxDataGridComponent,
        private clipboardService: ClipboardService
    ) {
        this.clipboardIcon = this.renderer.createElement('i');
        this.clipboardIcon.addEventListener('click', this.copyToClipboard, true);
        this.renderer.addClass(this.clipboardIcon, 'save-to-clipboard');
    }

    ngOnInit() {
        this.subscriptions.push(
            this.component.onInitialized.subscribe(event => {
                setTimeout(() =>
                    DataGridService.toggleCompactRowsHeight(this.component, true)
                );
                this.checkInitDateCellColumn(event.component);
            }),
            this.component.onOptionChanged.subscribe(event => {
                if (event.name == 'dataSource' || event.name == 'summary')
                    setTimeout(() => this.checkInitDateCellColumn(event.component));
            }),
            this.component.onCellHoverChanged.subscribe(event => {
                if (event.rowType == 'data') {
                    if (event.eventType == 'mouseover') {
                        if (event.column.name == 'hiddenTime') {
                            let text = event.cellElement.querySelector('span');
                            if (!text) {
                                event.cellElement.innerHTML = '';
                                text = this.renderer.createElement('span');
                                this.renderer.appendChild(event.cellElement, text);
                            }
                            text.innerText = this.getDateFormated(event.data[event.column.dataField], false);
                        }
                        if (event.cellElement.classList.contains('clipboard-holder'))
                            this.appendClipboardIcon(event.cellElement);
                        else
                            this.appendClipboardIcon(event.cellElement.querySelector('.clipboard-holder'));
                    }
                    if (event.eventType == 'mouseout') {
                        if (event.column.name == 'hiddenTime') {
                            let text = event.cellElement.querySelector('span');
                            text.innerText = event.value ? this.getDateFormated(event.data[event.column.dataField]) : '';
                        }
                    }
                }
            }),
            this.component.onContentReady.subscribe(event => {
                let dataSource = event.component.getDataSource();
                if (!dataSource || !dataSource.group())
                    event.element.classList.remove('show-group-panel');
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
            })
        );
    }

    checkInitDateCellColumn(component) {
        component.option('columns').forEach(column => {
            if (column.cellTemplate == 'dateCell') {
                this.initDateCellColumn(column, component);
            }
        });
    }

    initDateCellColumn(column, component) {
        component.columnOption(column.dataField, 'name', 'hiddenTime');
        component.columnOption(column.dataField, 'minWidth', '180px');
        component.columnOption(column.dataField, 'cellTemplate', undefined);
        component.columnOption(column.dataField, 'cssClass', column.cssClass + ' clipboard-holder');
        component.columnOption(column.dataField, 'calculateCellValue', (data) => {
            return this.getDateFormated(data[column.dataField]);
        });
    }

    getDateFormated(value: string, withoutTime = true) {
        let date = value && this.datePipe.transform(
            value, AppConsts.formatting.dateTime, this.timezone);
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