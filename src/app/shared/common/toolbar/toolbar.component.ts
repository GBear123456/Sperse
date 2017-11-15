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
  private supportedButtons = {
      back: {
          hint: this.l('Back'),
          iconSrc: 'assets/common/icons/back-arrow.svg'
      },
      assign: {
          text: this.l('Assign'),
          iconSrc: 'assets/common/icons/assign-icon.svg'
      },
      status: {
          text: this.l('Status'),
          iconSrc: 'assets/common/icons/status-icon.svg'
      },
      delete: {
          text: this.l('Delete'),
          iconSrc: 'assets/common/icons/delete-icon.svg'
      },
      folder: {
          hint: this.l('Folder'),
          iconSrc: 'assets/common/icons/folder.svg'
      },
      pen: {
          hint: this.l('Pen'),
          iconSrc: 'assets/common/icons/pen.svg'
      },
      more: {
          text: this.l('More')
      },
      box: {
          hint: this.l('Box'),
          iconSrc: 'assets/common/icons/box-icon.svg'
      },
      pipeline: {
          hint: this.l('Pipeline'),
          iconSrc: 'assets/common/icons/pipeline-icon.svg'
      },
      grid: {
          hint: this.l('Grid'),
          iconSrc: 'assets/common/icons/table-icon.svg'
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
          iconSrc: 'assets/common/icons/download-icon.svg'
      },
      refresh: {
          hint: this.l('Refresh'),
          icon: 'icon icon-refresh'
      },
      edit: {
          text: this.l('Edit'),
          iconSrc: 'assets/common/icons/edit-pencil-icon.svg'
      },
      rules: {
          text: this.l('Rules'),
          iconSrc: 'assets/common/icons/rules-icon.svg'
      },
      expand: {
          text: this.l('Expand'),
          iconSrc: 'assets/common/icons/expand-all-icon.svg'
      },
      flag: {
          hint: this.l('Flag'),
          iconSrc: 'assets/common/icons/flag-icon.svg'
      },
      print: {
          hint: this.l('Print'),
          iconSrc: 'assets/common/icons/print-icon.svg'
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

  initToolbarItems() {
    this._config.forEach((group) => {
      let count = group.items.length;
      group.items.forEach((item, index) => {
        let isLast = count == index + 1;
        this.items.push({
          location: group.location,
          widget: 'dxButton',
          options: _.extend({
            onClick: item.action,
            elementAttr: {
              'group-item-position': index ?
                (isLast ? 'last': 'inside') : (isLast ? 'single': 'first'),
              'group-item-count': count,
              'group-item-index': count - index
            }
          }, _.extend(this.supportedButtons[item.name] || {}, item.options))
        });
      });

    });
  }
}
