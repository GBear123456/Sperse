import { Component, Injector, Input, Output, EventEmitter, HostListener, HostBinding } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { ToolbarGroupModel, ToolbarGroupModelItem } from './toolbar.model';

import * as _ from 'underscore';
import { AppConsts } from '@shared/AppConsts';

@Component({
    selector: 'app-toolbar',
    templateUrl: './toolbar.component.html',
    styleUrls: ['./toolbar.component.less']
})
export class ToolBarComponent extends AppComponentBase {
    @Input('width') width = '100%';
    @Input('compact') compact = false;
    private _config: ToolbarGroupModel[];
    @Input()
    set config(config: ToolbarGroupModel[]) {
        this._config = config;
        this.initToolbarItems();
    }
    @HostBinding('style.display') display: string;
    public items = [];
    @Input()
    set localizationSource(value: string) {
        this._localizationSource = value;
        this.supportedButtons = this.getSupportedButtons();
    }
    private _localizationSource = AppConsts.localization.defaultLocalizationSourceName;
    public responsiveItems = [];
    public options = {};
    private supportedButtons = {};

    constructor(injector: Injector) {
        super(injector);
        this.supportedButtons = this.getSupportedButtons();
    }
    @HostListener('window:resize') onResize() {
        this.initToolbarItems();
    }

    private getSupportedButtons() {
        return {
            search: {
                accessKey: 'search'
            },
            filters: {
                hint: this.ls(this._localizationSource, 'Filters'),
                accessKey: 'filters'
            },
            expandTree: {
                text: this.ls(this._localizationSource, 'Expand'),
                icon: this.getImgURI('expand-tree-icon')
            },
            find: {
                hint: this.ls(this._localizationSource, 'Find'),
                text: this.ls(this._localizationSource, 'Find'),
                icon: this.getImgURI('find-icon')
            },
            sort: {
                hint: this.ls(this._localizationSource, 'Sort'),
                text: this.ls(this._localizationSource, 'Sort'),
                icon: this.getImgURI('sort-icon-down')
            },
            follow: {
                icon: this.getImgURI('follow-icon')
            },
            back: {
                hint: this.ls(this._localizationSource, 'Back'),
                icon: this.getImgURI('back-arrow')
            },
            assign: {
                text: this.ls(this._localizationSource, 'Assign'),
                icon: this.getImgURI('assign-icon')
            },
            status: {
                text: this.ls(this._localizationSource, 'Status'),
                icon: this.getImgURI('status-icon')
            },
            stage: {
                text: this.ls(this._localizationSource, 'Stage'),
                icon: this.getImgURI('status-icon')
            },
            partnerType: {
                accessKey: 'PartnerType',
                text: this.ls(this._localizationSource, 'Type'),
                icon: this.getImgURI('status-icon')
            },
            delete: {
                text: this.ls(this._localizationSource, 'Delete'),
                icon: this.getImgURI('delete-icon')
            },
            discard: {
                text: this.ls(this._localizationSource, 'Discard'),
                icon: this.getImgURI('delete-icon')
            },
            cancel: {
                text: this.ls(this._localizationSource, 'Cancel'),
                icon: this.getImgURI('close')
            },
            folder: {
                hint: this.ls(this._localizationSource, 'Folder'),
                icon: this.getImgURI('folder')
            },
            pen: {
                hint: this.ls(this._localizationSource, 'Pen'),
                icon: this.getImgURI('pen')
            },
            more: {
                text: this.ls(this._localizationSource, 'More')
            },
            box: {
                accessKey: 'box',
                hint: this.ls(this._localizationSource, 'Box'),
                icon: this.getImgURI('box-icon')
            },
            pipeline: {
                accessKey: 'pipeline',
                hint: this.ls(this._localizationSource, 'Pipeline'),
                icon: this.getImgURI('funnel-icon')
            },
            grid: {
                accessKey: 'grid',
                hint: this.ls(this._localizationSource, 'Grid'),
                icon: this.getImgURI('table-icon')
            },
            prev: {
                hint: this.ls(this._localizationSource, 'Previous'),
                icon: 'chevronprev'
            },
            next: {
                hint: this.ls(this._localizationSource, 'Next'),
                icon: 'chevronnext'
            },
            columnChooser: {
                hint: this.ls(this.localizationSource, 'ColumnChooser'),
                icon: 'column-chooser'
            },
            download: {
                hint: this.ls(this._localizationSource, 'Download'),
                icon: this.getImgURI('download-icon')
            },
            refresh: {
                hint: this.ls(this.localizationSource, 'Refresh'),
                icon: 'icon icon-refresh'
            },
            edit: {
                text: this.ls(this._localizationSource, 'Edit'),
                icon: this.getImgURI('edit-pencil-icon')
            },
            rules: {
                text: this.ls(this._localizationSource, 'CashflowToolbar_User_Preferences'),
                icon: this.getImgURI('preferences-icon')
            },
            expand: {
                text: this.ls(this._localizationSource, 'Expand'),
                icon: this.getImgURI('expand-all-icon')
            },
            expandRows: {
                text: this.ls(this._localizationSource, 'Expand rows'),
                icon: this.getImgURI('expand-rows-icon')
            },
            expandCols: {
                text: this.ls(this._localizationSource, 'Expand cols'),
                icon: this.getImgURI('expand-cols-icon')
            },
            flag: {
                hint: this.ls(this._localizationSource, 'Flags'),
                icon: this.getImgURI('flag-icon')
            },
            print: {
                hint: this.ls(this._localizationSource, 'Print'),
                icon: this.getImgURI('print-icon')
            },
            comments: {
                hint: this.ls(this._localizationSource, 'Show/Hide Comments'),
                icon: this.getImgURI('comments-icon')
            },
            fullscreen: {
                hint: this.ls(this._localizationSource, 'Fullpage'),
                icon: this.getImgURI('expand-fullscreen-icon')
            },
            slider: {
                hint: this.ls(this._localizationSource, 'Slider')
            },
            forecastModelAdd: {
                hint: this.ls(this._localizationSource, 'CreateForecastModel'),
                icon: this.getImgURI('add-button')
            },
            showCompactRowsHeight: {
                hint: this.ls(this._localizationSource, 'CompactView'),
                icon: this.getImgURI('ic_format_line_spacing')
            },
            reportPeriod: {
                icon: this.getImgURI('report-period'),
                text: this.ls(this._localizationSource, 'CashflowToolbar_Report_Period')
            },
            addEntity: {
                hint: this.ls(this._localizationSource, 'AddAccountingType'),
                icon: this.getImgURI('add-button')
            },
            tags: {
                text: this.ls(this._localizationSource, 'Tags'),
                icon: this.getImgURI('pen')
            },
            tagsSmall: {
                hint: this.ls(this._localizationSource, 'Tags'),
                icon: this.getImgURI('pen')
            },
            lists: {
                text: this.ls(this._localizationSource, 'Lists'),
                icon: this.getImgURI('folder')
            },
            listsSmall: {
                hint: this.ls(this._localizationSource, 'Lists'),
                icon: this.getImgURI('folder')
            },
            rating: {
                text: this.ls(this._localizationSource, 'Rating'),
                icon: this.getImgURI('flag-icon')
            },
            star: {
                hint: this.ls(this._localizationSource, 'Star'),
                icon: this.getImgURI('star-icon')
            },
            close: {
                hint: this.ls(this._localizationSource, 'Close'),
                icon: this.getImgURI('close')
            },
            rotateRight: {
                hint: this.ls(this._localizationSource, 'Rotate right'),
                icon: this.getImgURI('rotate-right-icon')
            },
            rotateLeft: {
                hint: this.ls(this._localizationSource, 'Rotate left'),
                icon: this.getImgURI('rotate-left-icon')
            }
        };
    }

    private toolbarItemAction(item: ToolbarGroupModelItem, group: ToolbarGroupModel, event: any) {
        if (item.action)
            item.action.call(this, event);
        if (group.areItemsDependent)
            group.items.forEach((i, index) => {
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
            item: '<div class="toolbar-dropdown-item" ' + (width ? 'style="width:' + width + 'px;"' : '') + '>' +
                (link.icon ? '<img style="margin-right: 15px; position: relative; top: -2px;" src="' + this.getImgURI(link.icon) + '">' : '') + link.text + '</div>',
            option: '<div><input type="checkbox" id="' + link.name + '" class="dropdown-option-checkbox"' + (link.checked || link.checked == undefined ? ' checked' : '') + '><label for="' + link.name + '">' + link.text + '</label></div>',
            downloadOptions: '<div class="toolbar-download-options" onclick="event.stopPropagation()">' +
                '<div><input type="radio" name="export" value="all" checked><label>' + this.l('Export all data') + '</label></div>' +
                '<div><input type="radio" name="export" value="selected"><label>' + this.l('Export selected') + '</label></div>' +
                '</div>',
            header: '<span class="dropdown-header">' + link.text + '</span>',
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
            return {
                'select-caption': item.text ? item.text + ':' : '',
                'select-value': items && items.length ? (
                    item.options.selectedIndex !== undefined ?
                        item.options['items'][item.options.selectedIndex].text :
                        item.options['items'][0].text
                ) : ''
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
            item.options['items'].forEach(link => {
                link.disabled = link.hasOwnProperty('disabled') ? link.disabled : (link.type == 'delimiter');
                link.html = this.getDropDownItemTemplate(
                    link, item.options['width']);
                link.onClick = (event) => {
                    if (item.name == 'select-box')
                        $('.dx-dropdownmenu-button[select-caption' + (item.text ? '="' + item.text + ':"' : '') + ']')
                            .attr('select-value', event.itemData.text);
                    /** if each item has its own click handler - call it */
                    (link.action && link.action.call(this, this.getOptions() || event)) ||
                    /** if all items use general select handler - call general */
                    (item.options.onSelectionChanged && item.options.onSelectionChanged.call(this, this.getOptions() || event));
                };
            });
        }
    }

    initToolbarItems() {
        this.supportedButtons = this.getSupportedButtons();
        let items = [];
        if (this._config)
            this._config.forEach((group) => {
                let count = group.items.length;
                group.items.forEach((item, index) => {
                    this.initDropDownMenu(item);
                    let isLast = count == index + 1;
                    let internalConfig = this.supportedButtons[item.name];
                    let mergedConfig = _.extend(internalConfig || {}, item.options);

                    items.push({
                        location: group.location,
                        locateInMenu: group.locateInMenu,
                        disabled: item.disabled,
                        visible: item.visible,
                        widget: (item.text !== undefined || item.html !== undefined) && !item.widget ? null : item.widget || 'dxButton',
                        text: !item.widget && item.text,
                        html: !item.widget && item.html,
                        itemTemplate: item.itemTemplate || group.itemTemplate,
                        options: _.extend({
                            onClick: (e) => this.toolbarItemAction(item, group, e),
                            elementAttr: _.extend({
                                'button-pressed': Boolean(mergedConfig &&
                                    mergedConfig['checkPressed'] && mergedConfig['checkPressed'].call(this)),
                                'group-item-position': index ? (isLast ? 'last' : 'inside') : (isLast ? 'single' : 'first'),
                                'group-item-count': count,
                                'group-item-index': count - index
                            }, this.getElementAttr(item))
                        }, mergedConfig)
                    });
                });
            });
        this.items = items;
    }
}
