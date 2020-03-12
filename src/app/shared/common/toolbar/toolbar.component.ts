/** Core imports */
import { Component, Input, HostBinding, OnDestroy, ViewChild, ChangeDetectionStrategy } from '@angular/core';

/** Third party imports */
import { MatDialogRef } from '@angular/material/dialog';
import cloneDeep from 'lodash/cloneDeep';
import { DxToolbarComponent } from 'devextreme-angular/ui/toolbar';
import { Subscription } from 'rxjs';
import * as _ from 'underscore';

/** Application imports */
import { ToolbarGroupModel, ToolbarGroupModelItem } from './toolbar.model';
import { FiltersService } from '@shared/filters/filters.service';
import { ToolbarService } from '@app/shared/common/toolbar/toolbar.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { AppService } from '@app/app.service';

@Component({
    selector: 'app-toolbar',
    templateUrl: './toolbar.component.html',
    styleUrls: ['./toolbar.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ToolBarComponent implements OnDestroy {
    @ViewChild(DxToolbarComponent, { static: false }) toolbarComponent: DxToolbarComponent;
    @Input() width = '100%';
    _config: ToolbarGroupModel[];
    @Input()
    set config(config: ToolbarGroupModel[]) {
        this._config = config;
        this.initToolbarItems();
    }
    @HostBinding('style.display') display: string;
    @HostBinding('class.compact') @Input() compact = false;
    public items = [];
    public options = {};
    private subscription: Subscription = this.filtersService.filterToggle$.subscribe((enabled) => {
        enabled || this.updateToolbarItemAttribute('filters', 'filter-selected', this.filtersService.hasFilterSelected);
    });
    private fixedSubscription: Subscription = this.filtersService.filterFixed$.subscribe((fixed) => {
        this.updateToolbarItemAttribute('filters', 'button-pressed', fixed);
    });
    openedDialogs: { [accessKey: string]: MatDialogRef<any> } = {};

    constructor(
        private filtersService: FiltersService,
        private ls: AppLocalizationService,
        public appService: AppService
    ) {}

    private getSupportedButtons() {
        return {
            forward: {
                hint: this.ls.l('Forward'),
                icon: this.getImgURI('forward')
            },
            replyToAll: {
                hint: this.ls.l('ReplyToAll'),
                icon: this.getImgURI('replyToAll')
            },
            reply: {
                hint: this.ls.l('Reply'),
                icon: this.getImgURI('reply')
            },
            archive: {
                text: this.ls.l('Archive'),
                icon: this.getImgURI('folder')
            },
            search: {
                accessKey: 'search'
            },
            filters: {
                hint: this.ls.l('Filters'),
                accessKey: 'filters'
            },
            expandTree: {
                text: this.ls.l('Expand'),
                icon: this.getImgURI('expand-tree-icon')
            },
            find: {
                hint: this.ls.l('Find'),
                text: this.ls.l('Find'),
                icon: this.getImgURI('find-icon')
            },
            rowFilter: {
                hint: this.ls.l('Find'),
                accessKey: 'row-filter',
                icon: this.getImgURI('find-icon')
            },
            sort: {
                hint: this.ls.l('Sort'),
                text: this.ls.l('Sort'),
                icon: this.getImgURI('sort-icon-down')
            },
            follow: {
                icon: this.getImgURI('follow-icon')
            },
            back: {
                hint: this.ls.l('Back'),
                icon: this.getImgURI('back-arrow')
            },
            add: {
                text: this.ls.l('Add'),
                icon: this.getImgURI('assign-icon')
            },
            assign: {
                text: this.ls.l('Assign'),
                icon: this.getImgURI('assign-icon')
            },
            status: {
                text: this.ls.l('Status'),
                icon: this.getImgURI('status-icon')
            },
            stage: {
                text: this.ls.l('Stage'),
                icon: this.getImgURI('status-icon')
            },
            partnerType: {
                accessKey: 'PartnerType',
                text: this.ls.l('Type'),
                icon: this.getImgURI('status-icon')
            },
            delete: {
                text: this.ls.l('Delete'),
                icon: this.getImgURI('delete-icon')
            },
            discard: {
                text: this.ls.l('Discard'),
                icon: this.getImgURI('delete-icon')
            },
            cancel: {
                text: this.ls.l('Cancel'),
                icon: this.getImgURI('close')
            },
            folder: {
                hint: this.ls.l('Folder'),
                icon: this.getImgURI('folder')
            },
            pen: {
                hint: this.ls.l('Pen'),
                icon: this.getImgURI('pen')
            },
            more: {
                text: this.ls.l('More')
            },
            box: {
                accessKey: 'box',
                hint: this.ls.l('Box'),
                icon: this.getImgURI('box-icon')
            },
            pipeline: {
                accessKey: 'pipeline',
                hint: this.ls.l('Pipeline'),
                icon: this.getImgURI('funnel-icon')
            },
            dataGrid: {
                accessKey: 'dataGrid',
                hint: this.ls.l('Data Grid'),
                icon: this.getImgURI('table-icon')
            },
            pivotGrid: {
                accessKey: 'pivotGrid',
                hint: this.ls.l('Pivot Grid'),
                icon: this.getImgURI('pivot-grid')
            },
            map: {
                accessKey: 'map',
                hint: this.ls.l('Map'),
                icon: this.getImgURI('map')
            },
            chart: {
                accessKey: 'chart',
                hint: this.ls.l('Chart'),
                icon: this.getImgURI('slice-chart')
            },
            prev: {
                hint: this.ls.l('Previous'),
                icon: 'chevronprev'
            },
            next: {
                hint: this.ls.l('Next'),
                icon: 'chevronnext'
            },
            columnChooser: {
                hint: this.ls.l('ColumnChooser'),
                icon: 'column-chooser'
            },
            download: {
                hint: this.ls.l('Download'),
                icon: this.getImgURI('download-icon')
            },
            refresh: {
                hint: this.ls.l('Refresh'),
                icon: 'icon icon-refresh'
            },
            edit: {
                text: this.ls.l('Edit'),
                icon: this.getImgURI('edit-pencil-icon')
            },
            rules: {
                text: this.ls.l('CashflowToolbar_User_Preferences'),
                icon: this.getImgURI('preferences-icon')
            },
            expand: {
                text: this.ls.l('Expand'),
                icon: this.getImgURI('expand-all-icon')
            },
            expandRows: {
                text: this.ls.l('Expand rows'),
                icon: this.getImgURI('expand-rows-icon')
            },
            expandCols: {
                text: this.ls.l('Expand cols'),
                icon: this.getImgURI('expand-cols-icon')
            },
            flag: {
                hint: this.ls.l('Flags'),
                icon: this.getImgURI('flag-icon')
            },
            print: {
                hint: this.ls.l('Print'),
                icon: this.getImgURI('print-icon')
            },
            comments: {
                hint: this.ls.l('Show/Hide Comments'),
                icon: this.getImgURI('comments-icon')
            },
            fullscreen: {
                hint: this.ls.l('Fullpage'),
                icon: this.getImgURI('toggle-fullscreen')
            },
            slider: {
                hint: this.ls.l('Slider')
            },
            forecastModelAdd: {
                hint: this.ls.l('CreateForecastModel'),
                icon: this.getImgURI('add-button')
            },
            showCompactRowsHeight: {
                hint: this.ls.l('CompactView'),
                icon: this.getImgURI('ic_format_line_spacing')
            },
            reportPeriod: {
                icon: this.getImgURI('report-period'),
                text: this.ls.l('CashflowToolbar_Report_Period')
            },
            addEntity: {
                hint: this.ls.l('AddAccountingType'),
                icon: this.getImgURI('add-button')
            },
            tags: {
                text: this.ls.l('Tags'),
                icon: this.getImgURI('pen')
            },
            tagsSmall: {
                hint: this.ls.l('Tags'),
                icon: this.getImgURI('pen')
            },
            lists: {
                text: this.ls.l('Lists'),
                icon: this.getImgURI('folder')
            },
            listsSmall: {
                hint: this.ls.l('Lists'),
                icon: this.getImgURI('folder')
            },
            rating: {
                text: this.ls.l('Rating'),
                icon: this.getImgURI('flag-icon')
            },
            star: {
                hint: this.ls.l('Star'),
                icon: this.getImgURI('star-icon')
            },
            close: {
                hint: this.ls.l('Close'),
                icon: this.getImgURI('close')
            },
            rotateRight: {
                hint: this.ls.l('Rotate right'),
                icon: this.getImgURI('rotate-right-icon')
            },
            rotateLeft: {
                hint: this.ls.l('Rotate left'),
                icon: this.getImgURI('rotate-left-icon')
            },
            category: {
                hint: this.ls.l('Category'),
                text: this.ls.l('Category'),
                icon: this.getImgURI('folder')
            },
            options: {
                hint: this.ls.l('Options'),
                icon: this.getImgURI('gear-icon')
            }
        };
    }

    private toolbarItemAction(item: ToolbarGroupModelItem, group: ToolbarGroupModel, event: any) {
        if (item.action) {
            /** Call action event */
            const actionCall = item.action.call(this, event);
            /** Handle toggling of right side dialogs */
            if (item.name === 'options' && item.accessKey && actionCall.subscribe) {
                if (!this.openedDialogs[item.accessKey]) {
                    actionCall.subscribe((dialogRef: MatDialogRef<any>) => {
                        this.openedDialogs[item.accessKey] = dialogRef;
                        dialogRef.afterClosed().subscribe(() => {
                            this.openedDialogs[item.accessKey] = null;
                        });
                    });
                } else if (this.openedDialogs[item.accessKey] && this.openedDialogs[item.accessKey] instanceof MatDialogRef) {
                    this.openedDialogs[item.accessKey].close();
                }
            }
        }
        if (group.areItemsDependent)
            group.items.forEach(i => {
                $('.dx-button[accesskey=' + i.name + ']').removeAttr('button-pressed');
            });

        let checkPressed = item.options && item.options['checkPressed'];
        if (checkPressed)
            event.element.setAttribute('button-pressed', Boolean(checkPressed.call(this)));
    }

    getImgURI(name: string) {
        return './assets/common/icons/' + name + '.svg';
    }

    getDropDownItemTemplate(link, width) {
        return {
            item: `<div class="toolbar-dropdown-item" ${width ? 'style="width:' + width + 'px;"' : ''}>
                ${link.icon ? `<img style="margin-right: 15px; position: relative; top: -2px;" src="${this.getImgURI(link.icon)}">` : ''}
                ${link.text}
            </div>`,
            option: `<div>
                <input type="checkbox" id="${link.name}" class="dropdown-option-checkbox"${link.checked || link.checked == undefined ? ' checked' : ''}>
                <label for="${link.name}">${link.text}</label>
            </div>`,
            downloadOptions: `<div class="toolbar-download-options" onclick="event.stopPropagation()">
                <div><input type="radio" name="export" value="all" checked id="allDataExport"><label for="allDataExport">${this.ls.l('Export all data')}</label></div>
                <div><input type="radio" name="export" value="selected" id="selectedDataExport"><label for="selectedDataExport">${this.ls.l('Export selected')}</label></div>
             </div>`,
            header: `<span class="dropdown-header">${link.text}</span>`,
            delimiter: '<hr>'
        }[link.type || 'item'];
    }

    getOptions() {
        let option = document.querySelector('.toolbar-download-options input:checked');
        return option ? option.getAttribute('value') : undefined;
    }

    getElementAttr(item) {
        if (item.name == 'select-box') {
            let items = item.options['items'];
            const selectedItem = item.options.selectedIndex !== undefined
                ? item.options['items'][item.options.selectedIndex]
                : item.options['items'][0];
            return {
                'select-caption': item.text ? item.text + ':' : '',
                'select-value': items && items.length && selectedItem ? selectedItem.text : ''
            };
        }
        return item.attr || {};
    }

    onItemRendered($event) {
        if ($event.itemData.options.mouseover)
            $($event.itemElement).on('mouseover',
                $event.itemData.options.mouseover);
        if ($event.itemData.options.mouseout)
            $($event.itemElement).on('mouseout',
                $event.itemData.options.mouseout);
    }

    initDropDownMenu(item) {
        if (item.widget == 'dxDropDownMenu') {
            item.options['accessKey'] = item.name;
            /** To avoid modifying of incoming data */
            item.options['items'] = cloneDeep(item.options['items']);
            item.options['items'].forEach(link => {
                link.disabled = link.hasOwnProperty('disabled') ? link.disabled : link.type == 'delimiter';
                link.html = this.getDropDownItemTemplate(link, item.options['width']);
                link.onClick = (event) => {
                    if (item.name == 'select-box') {
                        $('.dx-dropdownmenu-button[title' + (item.options.hint ? '="' + item.options.hint + '"' : '') + ']')
                            .attr('select-value', event.itemData.text);
                    }
                    /** if each item has its own click handler - call it */
                    (link.action && link.action.call(this, this.getOptions() || event)) ||
                    /** if all items use general select handler - call general */
                    (item.options.onSelectionChanged && item.options.onSelectionChanged.call(this, this.getOptions() || event));
                };
            });
        }
    }

    checkItemVisible(item) {
        return !item.hasOwnProperty('visible') || item.visible;
    }

    initToolbarItems() {
        let supportedButtons = this.getSupportedButtons();
        let items = [];
        if (this._config)
            this._config.forEach((group) => {
                let groupItems = group.items.filter((item => this.checkItemVisible(item))),
                    count = groupItems.length;
                groupItems.forEach((item, index) => {
                    this.initDropDownMenu(item);
                    let internalConfig = supportedButtons[item.name];
                    let mergedConfig = _.extend(internalConfig || {}, item.options);

                    this.checkItemVisible(item) && items.push({
                        name: item.name,
                        location: group.location,
                        locateInMenu: group.locateInMenu,
                        disabled: item.disabled,
                        widget: (item.text !== undefined || item.html !== undefined) && !item.widget ? null : item.widget || 'dxButton',
                        text: !item.widget && item.text,
                        html: !item.widget && item.html,
                        itemTemplate: item.itemTemplate || group.itemTemplate,
                        options: _.extend({
                            focusStateEnabled: true,
                            onClick: (e) => this.toolbarItemAction(item, group, e),
                            elementAttr: _.extend({
                                'button-pressed': Boolean(mergedConfig &&
                                    mergedConfig['checkPressed'] && mergedConfig['checkPressed'].call(this)),
                                'group-item-position': ToolbarService.getGroupItemPosition(index, count),
                                'group-item-count': count,
                                'group-item-index': ToolbarService.getGroupItemIndex(index, count)
                            }, this.getElementAttr(item))
                        }, mergedConfig)
                    });
                });
            });
        this.items = items;
    }

    updateToolbarItemAttribute(itemName: string, property: string, value: any) {
        const toolbarItemIndex = this.items.findIndex(item => item.name === itemName);
        if (toolbarItemIndex !== -1 && this.toolbarComponent) {
            this.toolbarComponent.instance.option(`items[${toolbarItemIndex}].options.elementAttr.${property}`, value);
        }
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
        this.fixedSubscription.unsubscribe();
    }
}
