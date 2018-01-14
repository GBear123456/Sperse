import { Component, Injector, Input, Output, EventEmitter } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { ToolbarGroupModel } from './toolbar.model';

import * as _ from 'underscore';

@Component({
    selector: 'app-toolbar',
    templateUrl: './toolbar.component.html',
    styleUrls: ['./toolbar.component.less'],
    // @HostLinstener('window:resize'): {
    //     : 'toogleToolbarMenu()'
    // }
})
export class ToolBarComponent extends AppComponentBase {
    @Input('adaptive') adaptive = false;
    public options = {};
    showAdaptiveToolbar: boolean;
    private supportedButtons = {
        search: {
            accessKey: 'search'
        },
        filters: {
            hint: this.l('Filters'),
            accessKey: 'filters'
        },
        back: {
            hint: this.l('Back'),
            iconSrc: this.getImgURI('back-arrow')
        },
        assign: {
            text: this.l('Assign'),
            iconSrc: this.getImgURI('assign-icon')
        },
        status: {
            text: this.l('Status'),
            iconSrc: this.getImgURI('status-icon')
        },
        delete: {
            text: this.l('Delete'),
            iconSrc: this.getImgURI('delete-icon')
        },
        folder: {
            hint: this.l('Folder'),
            iconSrc: this.getImgURI('folder')
        },
        pen: {
            hint: this.l('Pen'),
            iconSrc: this.getImgURI('pen')
        },
        more: {
            text: this.l('More')
        },
        box: {
            hint: this.l('Box'),
            iconSrc: this.getImgURI('box-icon')
        },
        pipeline: {
            hint: this.l('Pipeline'),
            iconSrc: this.getImgURI('funnel-icon')
        },
        grid: {
            hint: this.l('Grid'),
            iconSrc: this.getImgURI('table-icon')
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
            iconSrc: this.getImgURI('download-icon')
        },
        refresh: {
            hint: this.l('Refresh'),
            icon: 'icon icon-refresh'
        },
        edit: {
            text: this.l('Edit'),
            iconSrc: this.getImgURI('edit-pencil-icon')
        },
        rules: {
            text: this.l('CashflowToolbar_User_Preferences'),
            responsiveText: this.l('CashflowToolbar_User_Preferences'),
            iconSrc: this.getImgURI('preferences-icon')
        },
        expand: {
            text: this.l('Expand'),
            iconSrc: this.getImgURI('expand-all-icon')
        },
        expandRows: {
            text: this.l('Expand rows'),
            iconSrc: this.getImgURI('expand-rows-icon')
        },
        expandCols: {
            text: this.l('Expand cols'),
            iconSrc: this.getImgURI('expand-cols-icon')
        },
        flag: {
            hint: this.l('Flags'),
            iconSrc: this.getImgURI('flag-icon')
        },
        print: {
            hint: this.l('Print'),
            iconSrc: this.getImgURI('print-icon')
        },
        comments: {
            hint: this.l('Show/Hide Comments'),
            iconSrc: this.getImgURI('comments-icon')
        },
        fullscreen: {
            hint: this.l('Fullpage'),
            iconSrc: this.getImgURI('expand-fullscreen-icon')
        },
        slider: {
            hint: this.l('Slider')
        },
        forecastModelAdd: {
            hint: this.l('CreateForecastModel'),
            iconSrc: this.getImgURI('add-button')
        }
    };

    responsiveItems = [];

    private _config: ToolbarGroupModel[];
    @Input()
    set config(config: ToolbarGroupModel[]) {
        this._config = config;
        this.toogleToolbarMenu();
        this.initToolbarItems();
    }

    @Output() onApply = new EventEmitter();

    public items = [];

    constructor(injector: Injector) {
        super(injector);
    }

    getImgURI(name: string) {
        return 'assets/common/icons/' + name + '.svg';
    }

    getDropDownItemTemplate(link, width) {
        return {
            item: '<div class="toolbar-dropdown-item" ' + (width ? 'style="width:' + width + 'px;"' : '') + '>' +
            (link.icon ? '<img src="' + this.getImgURI(link.icon) + '">' : '') + link.text + '</div>',
            downloadOptions: '<div class="toolbar-download-options" onclick="event.stopPropagation()">' +
            '<div><input type="radio" name="export" value="all" checked><label>' + this.l('Export all data') + '</label></div>' +
            '<div><input type="radio" name="export" value="selected"><label>' + this.l('Export selected') + '</label></div>' +
            '</div>'
        }[link.type || 'item'];
    }

    getOptions() {
        let option = document.querySelector('.toolbar-download-options input:checked');
        return option ? option.getAttribute('value') : undefined;
    }

    getElementAttr(item) {
        if (item.name == 'select-box')
            return {
                'select-caption': item.text,
                'select-value': item.options['items'][0].text
            };
        return item.attr || {};
    }

    onItemRendered($event) {
        if ($event.itemData.options.mouseover)
            $event.itemElement.on('mouseover',
                $event.itemData.options.mouseover);
        if ($event.itemData.options.mouseout)
            $event.itemElement.on('mouseout',
                $event.itemData.options.mouseout);
    }

    toogleToolbarMenu() {
        this.showAdaptiveToolbar = window.innerWidth < 1280;
        console.log(this.showAdaptiveToolbar);
    }

    initToolbarItems() {
        let items = [];
        let responsiveItems = [];
        this._config.forEach((group) => {
            let count = group.items.length;
            group.items.forEach((item, index) => {
                let isLast = count == index + 1;
                if (item.widget == 'dxDropDownMenu') {
                    item.options['accessKey'] = item.name;
                    item.options['items'].forEach(link => {
                        link.html = this.getDropDownItemTemplate(
                            link, item.options['width']);
                        link.onClick = (event) => {
                            if (item.name == 'select-box')
                                $('.dx-dropdownmenu-button[select-caption="' + item.text + '"]')
                                    .attr('select-value', event.itemData.text);
                            link.action && link.action.call(this, this.getOptions() || event);
                        };
                    });
                }
                let internalConfig = this.supportedButtons[item.name];
                let mergedConfig = _.extend(internalConfig || {}, item.options);
                if (item.adaptive === false || !this.showAdaptiveToolbar) {
                    items.push({
                        location: group.location,
                        widget: (item.text !== undefined || item.html !== undefined) && !item.widget ? null : item.widget || 'dxButton',
                        text: !item.widget && item.text,
                        html: !item.widget && item.html,
                        itemTemplate: item.itemTemplate || group.itemTemplate,
                        options: _.extend({
                            onClick: item.action,
                            elementAttr: _.extend({
                                'group-item-position': index ? (isLast ? 'last' : 'inside') : (isLast ? 'single' : 'first'),
                                'group-item-count': count,
                                'group-item-index': count - index
                            }, this.getElementAttr(item))
                        }, mergedConfig)
                    });
                }
                if (item.adaptive !== false) {
                    let responsiveSubitems;
                    if (item.options && item.options.items) {
                        responsiveSubitems = item.options.items.slice();
                        responsiveSubitems.forEach((responsiveSubitem, index) => {
                            responsiveSubitem.itemIndex = index;
                            if (responsiveSubitem.html)
                                delete responsiveSubitem.text;
                        });
                    }
                    responsiveItems.push({
                        text: item.text || mergedConfig.text || mergedConfig.hint,
                        items: responsiveSubitems,
                        onClick: item.action
                    })
                }
            });
        });
        this.items = items;
        this.responsiveItems = responsiveItems;
    }

    onResponsiveItemClick(e) {
        e.itemIndex = e.itemData.itemIndex;
    }
}
