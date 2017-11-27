import { Component, Injector, Input, Output, EventEmitter } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { ToolbarGroupModel } from './toolbar.model';

import * as _ from 'underscore';

@Component({
  selector: 'app-toolbar',
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.less']
})
export class ToolBarComponent extends AppComponentBase {
  public options = {};
  private supportedButtons = {
      comments: {
          hint: this.l('Comments'),
          iconSrc: this.getImgURI('comments')
      },
      fullscreen: {
          hint: this.l('Fullscreen'),
          iconSrc: this.getImgURI('fullscreen')
      },
      filters: {
          text: this.l('Filters'),
          iconSrc: this.getImgURI('funnel-icon')
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
          text: this.l('Rules'),
          iconSrc: this.getImgURI('rules-icon')
      },
      expand: {
          text: this.l('Expand'),
          iconSrc: this.getImgURI('expand-all-icon')
      },
      flag: {
          hint: this.l('Flag'),
          iconSrc: this.getImgURI('flag-icon')
      },
      print: {
          hint: this.l('Print'),
          iconSrc: this.getImgURI('print-icon')
      }
  };

  private _config: ToolbarGroupModel[];
  @Input()
  set config(config: ToolbarGroupModel[]){
    this._config = config;
    this.initToolbarItems();
  }

	@Output() onApply = new EventEmitter();

  public items = [];

  constructor(
    injector: Injector
  ) {
    super(injector);
  }

  getImgURI(name: string) {
    return 'assets/common/icons/' + name + '.svg';
  }

  getDropDownItemTemplate(link, width) { 
    return {
      item: '<div class="toolbar-dropdown-item" ' + (width ? 'style="width:' + width + 'px;"': '') + '>' +
          (link.icon ? '<img src="' + this.getImgURI(link.icon) + '">': '') + link.text + '</div>',
      downloadOptions: '<div class="toolbar-download-options" onclick="event.stopPropagation()">' +
          '<div><input type="radio" name="export" value="all" checked><label>' + this.l('Export all data') + '</label></div>' +
          '<div><input type="radio" name="export" value="selected"><label>' + this.l('Export selected') + '</label></div>' +
          '</div>'
    }[link.type || 'item'];
  }

  getOptions() {
      let option = document.querySelector('.toolbar-download-options input:checked');
      return option ? option.getAttribute('value'): undefined;
  }

  getElementAttr(item) {  
      if(item.name == 'select-box')
          return {
              'select-caption': item.text,
              'select-value': item.options['items'][0].text
          };
      return {};
  }

  initToolbarItems() {
    this._config.forEach((group) => {
      let count = group.items.length;
      group.items.forEach((item, index) => {
        let isLast = count == index + 1;
        if (item.widget == 'dxDropDownMenu') {          
          item.options['accessKey'] = item.name;
          item.options['items'].forEach((link) => {
            link.html = this.getDropDownItemTemplate(
                link, item.options['width']);
            link.onClick = (event) => {
              if(item.name == 'select-box')
                  $('.dx-dropdownmenu-button[select-caption="' + item.text + '"]')
                      .attr('select-value', event.itemData.text);                   
              link.action && link.action.call(this, this.getOptions() || event);
            };
          })
        }

        this.items.push({
          location: group.location,
          widget: item.widget || 'dxButton',
          options: _.extend({
            onClick: item.action,
            elementAttr: _.extend({
              'group-item-position': index ?
                (isLast ? 'last': 'inside') : (isLast ? 'single': 'first'),
              'group-item-count': count,
              'group-item-index': count - index
            }, this.getElementAttr(item))
          }, _.extend(this.supportedButtons[item.name] || {}, item.options))
        });
      });
    });
  }
}
