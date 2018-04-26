import { Component, Injector, Input, Output, EventEmitter, HostListener, HostBinding } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { ToolbarGroupModel, ToolbarGroupModelItem } from './toolbar.model';

import * as _ from 'underscore';

@Component({
    selector: 'app-toolbar',
    templateUrl: './toolbar.component.html',
    styleUrls: ['./toolbar.component.less']
})
export class ToolBarComponent extends AppComponentBase {
    @Input('adaptive') adaptive = false;
    @Input('compact') compact = false;
    private _config: ToolbarGroupModel[];
    @Input()
    set config(config: ToolbarGroupModel[]) {
        this._config = config;
        this.toogleToolbarMenu();
        this.initToolbarItems();
    }
    @HostBinding('style.display') display: string;
    public items = [];
    public responsiveItems = [];
    public options = {};
    public showAdaptiveToolbar: boolean;
    private supportedButtons = {
        search: {
            accessKey: 'search'
        },
        filters: {
            hint: this.l('Filters'),
            accessKey: 'filters'
        },
        expandTree: {
            text: this.l('Expand'),
            icon: this.getImgURI('expand-tree-icon')
        },
        find: {
            hint: this.l('Find'),
            text: this.l('Find'),
            icon: this.getImgURI('find-icon')
        },
        sort: {
            hint: this.l('Sort'),
            text: this.l('Sort'),
            icon: this.getImgURI('sort-icon-down')
        },
        follow: {
            icon: this.getImgURI('follow-icon')
        },
        back: {
            hint: this.l('Back'),
            icon: this.getImgURI('back-arrow')
        },
        assign: {
            text: this.l('Assign'),
            icon: this.getImgURI('assign-icon')
        },
        status: {
            text: this.l('Status'),
            icon: this.getImgURI('status-icon')
        },
        stage: {
            text: this.l('Stage'),
            icon: this.getImgURI('status-icon')
        },
        delete: {
            text: this.l('Delete'),
            icon: this.getImgURI('delete-icon')
        },
        discard: {
            text: this.l('Discard'),
            icon: this.getImgURI('delete-icon')
        },
        folder: {
            hint: this.l('Folder'),
            icon: this.getImgURI('folder')
        },
        pen: {
            hint: this.l('Pen'),
            icon: this.getImgURI('pen')
        },
        more: {
            text: this.l('More')
        },
        box: {
            accessKey: 'box',
            hint: this.l('Box'),
            icon: this.getImgURI('box-icon')
        },
        pipeline: {
            accessKey: 'pipeline',
            hint: this.l('Pipeline'),
            icon: this.getImgURI('funnel-icon')
        },
        grid: {
            accessKey: 'grid',
            hint: this.l('Grid'),
            icon: this.getImgURI('table-icon')
        },
        prev: {
            hint: this.l('Previous'),
            icon: 'chevronprev'
        },
        next: {
            hint: this.l('Next'),
            icon: 'chevronnext'
        },
        columnChooser: {
            hint: this.l('ColumnChooser'),
            icon: 'column-chooser'
        },
        download: {
            hint: this.l('Download'),
            icon: this.getImgURI('download-icon')
        },
        refresh: {
            hint: this.l('Refresh'),
            icon: 'icon icon-refresh'
        },
        edit: {
            text: this.l('Edit'),
            icon: this.getImgURI('edit-pencil-icon')
        },
        rules: {
            text: this.ls('CFO', 'CashflowToolbar_User_Preferences'),
            icon: this.getImgURI('preferences-icon')
        },
        expand: {
            text: this.l('Expand'),
            icon: this.getImgURI('expand-all-icon')
        },
        expandRows: {
            text: this.l('Expand rows'),
            icon: this.getImgURI('expand-rows-icon')
        },
        expandCols: {
            text: this.l('Expand cols'),
            icon: this.getImgURI('expand-cols-icon')
        },
        flag: {
            hint: this.l('Flags'),
            icon: this.getImgURI('flag-icon')
        },
        print: {
            hint: this.l('Print'),
            icon: this.getImgURI('print-icon')
        },
        comments: {
            hint: this.l('Show/Hide Comments'),
            icon: this.getImgURI('comments-icon')
        },
        fullscreen: {
            hint: this.l('Fullpage'),
            icon: this.getImgURI('expand-fullscreen-icon')
        },
        slider: {
            hint: this.l('Slider')
        },
        forecastModelAdd: {
            hint: this.l('CreateForecastModel'),
            icon: this.getImgURI('add-button')
        },
        showCompactRowsHeight: {
            hint: this.l('Compact View'),
            icon: this.getImgURI('ic_format_line_spacing')
        },
        reportPeriod: {
            icon: this.getImgURI('report-period'),
            text: this.ls('CFO', 'CashflowToolbar_Report_Period')
        },
        addEntity: {
            hint: this.l('AddEntity'),
            icon: this.getImgURI('add-button')
        },
        tags: {
            text: this.l('Tags'),
            icon: this.getImgURI('pen')
        },
        tagsSmall: {
            hint: this.l('Tags'),
            icon: this.getImgURI('pen')
        },
        lists: {
            text: this.l('Lists'),
            icon: this.getImgURI('folder')
        },
        listsSmall: {
            hint: this.l('Lists'),
            icon: this.getImgURI('folder')
        },
        rating: {
            text: this.l('Rating'),
            icon: this.getImgURI('flag-icon')
        },
        star: {
            hint: this.l('Star'),
            icon: this.getImgURI('star-icon')
        }
    };

    constructor(injector: Injector) {
        super(injector);
    }
    @HostListener('window:resize') onResize() {
        this.toogleToolbarMenu();
        this.initToolbarItems();
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
        return 'assets/common/icons/' + name + '.svg';
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
            var items = item.options['items'];
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

    toogleToolbarMenu() {
        this.showAdaptiveToolbar = this.adaptive && window.innerWidth < 1500;
        if (this.showAdaptiveToolbar)
            this.display = 'flex';
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
                        $('.dx-dropdownmenu-button[select-caption^="' + item.text + '"]')
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
        let items = [];
        let responsiveItems = [];
        this._config.forEach((group) => {
            let count = group.items.length;
            group.items.forEach((item, index) => {
                this.initDropDownMenu(item);
                if ((item.name && item.name == 'filters') || (item.name && item.name == 'search')) {
                    item.adaptive = false;
                }
                let isLast = count == index + 1;
                let internalConfig = this.supportedButtons[item.name];
                let mergedConfig = _.extend(internalConfig || {}, item.options);

                if (item.adaptive === false || !this.showAdaptiveToolbar) {
                    items.push({
                        location: group.location,
                        disabled: item.disabled,
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
                }
                if (this.showAdaptiveToolbar && item.adaptive !== false) {
                    let responsiveSubitems;
                    if (item.options && item.options.items) {
                        /** clone array */
                        responsiveSubitems = item.options.items.map(a => ({...a}));
                        responsiveSubitems.forEach((responsiveSubitem, subitemIndex) => {
                            responsiveSubitem.itemIndex = subitemIndex;
                            if (responsiveSubitem.html)
                                delete responsiveSubitem.text;
                                delete responsiveSubitem.icon;
                        });
                    }
                    responsiveItems.push({
                        text: item.text || mergedConfig.text || mergedConfig.hint,
                        items: responsiveSubitems,
                        onClick: item.action
                    });
                }
            });
        });
        this.items = items;
        this.responsiveItems = responsiveItems;
    }
}
