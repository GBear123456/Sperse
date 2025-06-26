/** Core imports */
import {
  Component,
  Input,
  HostBinding,
  OnDestroy,
  ChangeDetectorRef,
  ViewChild,
  ChangeDetectionStrategy,
  OnInit,
  TemplateRef,
} from '@angular/core';

/** Third party imports */
import cloneDeep from 'lodash/cloneDeep';
import { DxToolbarComponent } from 'devextreme-angular/ui/toolbar';
import { Subscription } from 'rxjs';
import { delay } from 'rxjs/operators';
import * as _ from 'underscore';

/** Application imports */
import { ToolbarGroupModel, ToolbarGroupModelItem } from './toolbar.model';
import { FiltersService } from '@shared/filters/filters.service';
import { ToolbarService } from '@app/shared/common/toolbar/toolbar.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { AppService } from '@app/app.service';
import { LayoutType } from '@shared/service-proxies/service-proxies';
import { UserManagementService } from '@shared/common/layout/user-management-list/user-management.service';
import { LayoutService } from '@app/shared/layout/layout.service';

@Component({
  selector: 'app-toolbar',
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToolBarComponent implements OnDestroy, OnInit {
  @ViewChild(DxToolbarComponent) toolbarComponent: DxToolbarComponent;
  @Input() titleTemplate: TemplateRef<any>;
  @Input() isDisabled = false;
  @Input() width = '100%';
  _config: ToolbarGroupModel[];
  @Input()
  set config(config: ToolbarGroupModel[]) {
    this._config = config;
    setTimeout(() => {
      this.initToolbarItems();
      this.changeDetectorRef.detectChanges();
    });
  }
  @Input() disableToolbarUpdateAfterFiltersFixing = false;
  @HostBinding('style.display') display: string;
  @HostBinding('class.compact') @Input() compact = false;
  public items = [];
  public options = {};
  private subscription: Subscription = this.filtersService.filterToggle$.subscribe(
    (enabled: boolean) => {
      enabled ||
        this.updateToolbarItemAttribute(
          'filters',
          'filter-selected',
          this.filtersService.hasFilterSelected
        );
    }
  );
  private fixedSubscription: Subscription;

  constructor(
    private changeDetectorRef: ChangeDetectorRef,
    private filtersService: FiltersService,
    private ls: AppLocalizationService,
    private userManagementService: UserManagementService,
    private toolbarService: ToolbarService,
    public layoutService: LayoutService,
    public appService: AppService
  ) {}

  ngOnInit() {
    if (!this.disableToolbarUpdateAfterFiltersFixing) {
      this.fixedSubscription = this.filtersService.filterFixed$
        .pipe(delay(100))
        .subscribe((fixed: boolean) => {
          this.updateToolbarItemAttribute('filters', 'button-pressed', fixed);
        });
    }
  }

  private getSupportedButtons() {
    return {
      forward: {
        hint: this.ls.l('Forward'),
        icon: this.getImgURI('forward'),
      },
      resend: {
        hint: this.ls.l('Resend'),
        icon: this.getImgURI('resend'),
      },
      replyToAll: {
        hint: this.ls.l('ReplyToAll'),
        icon: this.getImgURI('replyToAll'),
      },
      reply: {
        hint: this.ls.l('Reply'),
        icon: this.getImgURI('reply'),
      },
      archive: {
        text: this.ls.l('Toolbar_Archive'),
        hint: this.ls.l('Toolbar_Archive'),
        icon: this.getImgURI('folder'),
      },
      search: {
        accessKey: 'search',
        visible: this.layoutService.showTopBar,
      },
      title: {
        accessKey: 'title',
        itemTemplate: 'titleTemplate',
        visible: this.layoutService.showLeftBar,
      },
      filters: {
        hint: this.ls.l('Filters'),
        accessKey: 'filters',
      },
      expandTree: {
        text: this.ls.l('Expand'),
        hint: this.ls.l('Expand'),
        icon: this.getImgURI('expand-tree-icon'),
      },
      find: {
        hint: this.ls.l('Find'),
        text: this.ls.l('Find'),
        icon: this.getImgURI('find-icon'),
      },
      rowFilter: {
        hint: this.ls.l('Find'),
        accessKey: 'row-filter',
        icon: this.getImgURI('find-icon'),
      },
      sort: {
        hint: this.ls.l('Sort'),
        text: this.ls.l('Sort'),
        icon: this.getImgURI('sort-icon-down'),
      },
      follow: {
        icon: this.getImgURI('follow-icon'),
      },
      back: {
        hint: this.ls.l('Back'),
        icon: this.getImgURI('back-arrow'),
      },
      add: {
        text: this.ls.l('Add'),
        hint: this.ls.l('Add'),
        icon: this.getImgURI('assign-icon'),
      },
      assign: {
        text: this.ls.l('Toolbar_Assign'),
        hint: this.ls.l('Toolbar_Assign'),
        icon: this.getImgURI('assign-icon'),
      },
      status: {
        text: this.ls.l('Toolbar_Status'),
        hint: this.ls.l('Toolbar_Status'),
        icon: this.getImgURI('status-icon'),
      },
      stage: {
        text: this.ls.l('Toolbar_Stage'),
        hint: this.ls.l('Toolbar_Stage'),
        icon: this.getImgURI('status-icon'),
      },
      groups: {
        text: this.ls.l('Toolbar_Groups'),
        hint: this.ls.l('Toolbar_Groups'),
        icon: this.getImgURI('status-icon'),
      },
      partnerType: {
        accessKey: 'PartnerType',
        text: this.ls.l('Toolbar_Type'),
        hint: this.ls.l('Toolbar_Type'),
        icon: this.getImgURI('status-icon'),
      },
      delete: {
        text: this.ls.l('Delete'),
        hint: this.ls.l('Delete'),
        icon: this.getImgURI('delete-icon'),
      },
      discard: {
        text: this.ls.l('Discard'),
        hint: this.ls.l('Discard'),
        icon: this.getImgURI('delete-icon'),
      },
      cancel: {
        text: this.ls.l('Cancel'),
        hint: this.ls.l('Cancel'),
        icon: this.getImgURI('close'),
      },
      folder: {
        hint: this.ls.l('Folder'),
        icon: this.getImgURI('folder'),
      },
      pen: {
        hint: this.ls.l('Pen'),
        icon: this.getImgURI('pen'),
      },
      more: {
        text: this.ls.l('More'),
        hint: this.ls.l('More'),
      },
      box: {
        accessKey: 'box',
        hint: this.ls.l('Box'),
        icon: this.getImgURI('box-icon'),
      },
      pipeline: {
        accessKey: 'pipeline',
        hint: this.ls.l('Toolbar_Pipeline'),
        icon: this.getImgURI('funnel-icon'),
      },
      dataGrid: {
        accessKey: 'dataGrid',
        hint: this.ls.l('Toolbar_DataGrid'),
        icon: this.getImgURI('table-icon'),
      },
      pivotGrid: {
        accessKey: 'pivotGrid',
        hint: this.ls.l('Toolbar_PivotGrid'),
        icon: this.getImgURI('pivot-grid'),
      },
      gallery: {
        accessKey: 'gallery',
        hint: this.ls.l('Gallery'),
        icon: 'mediumiconslayout',
      },
      map: {
        accessKey: 'map',
        hint: this.ls.l('Map'),
        icon: this.getImgURI('map'),
      },
      chart: {
        accessKey: 'chart',
        hint: this.ls.l('Chart'),
        icon: this.getImgURI('slice-chart'),
      },
      prev: {
        hint: this.ls.l('Previous'),
        icon: 'chevronprev',
      },
      next: {
        hint: this.ls.l('Next'),
        icon: 'chevronnext',
      },
      columnChooser: {
        hint: this.ls.l('ColumnChooser'),
        icon: 'column-chooser',
      },
      download: {
        hint: this.ls.l('Download'),
        icon: this.getImgURI('download-icon'),
      },
      refresh: {
        hint: this.ls.l('Refresh'),
        icon: 'icon icon-refresh',
      },
      edit: {
        text: this.ls.l('Edit'),
        hint: this.ls.l('Edit'),
        icon: this.getImgURI('edit-pencil-icon'),
      },
      rules: {
        text: this.ls.l('CashflowToolbar_User_Preferences'),
        hint: this.ls.l('CashflowToolbar_User_Preferences'),
        icon: this.getImgURI('preferences-icon'),
      },
      expand: {
        text: this.ls.l('Expand'),
        hint: this.ls.l('Expand'),
        icon: this.getImgURI('expand-all-icon'),
      },
      expandRows: {
        text: this.ls.l('Toolbar_ExpandRows'),
        hint: this.ls.l('Toolbar_ExpandRows'),
        icon: this.getImgURI('expand-rows-icon'),
      },
      expandCols: {
        text: this.ls.l('Toolbar_ExpandCols'),
        hint: this.ls.l('Toolbar_ExpandCols'),
        icon: this.getImgURI('expand-cols-icon'),
      },
      flag: {
        hint: this.ls.l('Flags'),
        icon: this.getImgURI('flag-icon'),
      },
      print: {
        hint: this.ls.l('Print'),
        icon: this.getImgURI('print-icon'),
      },
      comments: {
        hint: this.ls.l('Toolbar_ToggleComments'),
        icon: this.getImgURI('comments-icon'),
      },
      fullscreen: {
        hint: this.ls.l('Fullpage'),
        icon: this.getImgURI('toggle-fullscreen'),
      },
      slider: {
        hint: this.ls.l('Slider'),
      },
      forecastModelAdd: {
        hint: this.ls.l('CreateForecastModel'),
        icon: this.getImgURI('add-button'),
      },
      showCompactRowsHeight: {
        hint: this.ls.l('CompactView'),
        icon: this.getImgURI('ic_format_line_spacing'),
      },
      reportPeriod: {
        icon: this.getImgURI('report-period'),
        text: this.ls.l('CashflowToolbar_Report_Period'),
        hint: this.ls.l('CashflowToolbar_Report_Period'),
      },
      addEntity: {
        hint: this.ls.l('AddAccountingType'),
        icon: this.getImgURI('add-button'),
      },
      tags: {
        text: this.ls.l('Toolbar_Tags'),
        hint: this.ls.l('Toolbar_Tags'),
        icon: this.getImgURI('pen'),
      },
      tagsSmall: {
        hint: this.ls.l('Toolbar_Tags'),
        icon: this.getImgURI('pen'),
      },
      lists: {
        text: this.ls.l('Toolbar_Lists'),
        hint: this.ls.l('Toolbar_Lists'),
        icon: this.getImgURI('folder'),
      },
      listsSmall: {
        hint: this.ls.l('Toolbar_Lists'),
        icon: this.getImgURI('folder'),
      },
      rating: {
        text: this.ls.l('Toolbar_Rating'),
        hint: this.ls.l('Toolbar_Rating'),
        icon: this.getImgURI('flag-icon'),
      },
      star: {
        hint: this.ls.l('Star'),
        icon: this.userManagementService.isLayout(LayoutType.BankCode)
          ? './assets/common/icons/focus.svg'
          : './assets/common/icons/star-icon.svg',
      },
      close: {
        hint: this.ls.l('Close'),
        icon: this.getImgURI('close'),
      },
      rotateRight: {
        hint: this.ls.l('RotateRight'),
        icon: this.getImgURI('rotate-right-icon'),
      },
      rotateLeft: {
        hint: this.ls.l('RotateLeft'),
        icon: this.getImgURI('rotate-left-icon'),
      },
      category: {
        hint: this.ls.l('Category'),
        text: this.ls.l('Category'),
        icon: this.getImgURI('folder'),
      },
      options: {
        accessKey: 'settings',
        icon: this.getImgURI('profile-gear'),
        text: this.ls.l('Settings'),
      },
      login: {
        hint: this.ls.l('Login'),
        accessKey: 'login',
        text: this.ls.l('Login'),
      },
      message: {
        text: this.ls.l('Message'),
        hint: this.ls.l('Message'),
      },
      actions: {
        text: this.ls.l('Actions'),
        hint: this.ls.l('Actions'),
      },
    };
  }

  private toolbarItemAction(item: ToolbarGroupModelItem, group: ToolbarGroupModel, event: any) {
    if (item.action) item.action.call(this, event);
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
      item: `<div class="toolbar-dropdown-item ${link.class || ''}" ${
        width ? 'style="width:' + width + 'px;"' : ''
      } [title]="link.text">
                ${
                  link.icon
                    ? `<img style="margin-right: 15px; position: relative; top: -2px;" src="${this.getImgURI(
                        link.icon
                      )}">`
                    : ''
                }
                ${link.text}
            </div>`,
      option: `<div>
                <input type="checkbox" id="${link.name}" class="dropdown-option-checkbox"${
        link.checked || link.checked == undefined ? ' checked' : ''
      }>
                <label for="${link.name}">${link.text}</label>
            </div>`,
      downloadOptions: `<div class="toolbar-download-options" onclick="event.stopPropagation()">
                <div><input type="radio" name="export" value="all" checked id="allDataExport"><label for="allDataExport">${this.ls.l(
                  'Export all data'
                )}</label></div>
                <div><input type="radio" name="export" value="selected" id="selectedDataExport"><label for="selectedDataExport">${this.ls.l(
                  'Export selected'
                )}</label></div>
             </div>`,
      header: `<span class="dropdown-header">${link.text}</span>`,
      delimiter: '<hr>',
    }[link.type || 'item'];
  }

  getOptions() {
    let option = document.querySelector('.toolbar-download-options input:checked');
    return option ? option.getAttribute('value') : undefined;
  }

  getElementAttr(item) {
    if (item.name == 'select-box') {
      let items = item.options['items'];
      const selectedItem =
        item.options.selectedIndex !== undefined
          ? item.options['items'][item.options.selectedIndex]
          : item.options['items'][0];
      return {
        'select-caption': item.text ? item.text + ':' : '',
        'select-value': items && items.length && selectedItem ? selectedItem.text : '',
      };
    }
    return item.attr || {};
  }

  onItemRendered($event) {
    if ($event.itemData.options.mouseover)
      $($event.itemElement).on('mouseover', $event.itemData.options.mouseover);
    if ($event.itemData.options.mouseout)
      $($event.itemElement).on('mouseout', $event.itemData.options.mouseout);
  }

  initDropDownMenu(item) {
    if (item.widget == 'dxDropDownMenu') {
      item.options['accessKey'] = item.name;
      /** To avoid modifying of incoming data */
      item.options['items'] = cloneDeep(item.options['items']);
      item.options['items'].forEach(link => {
        link.disabled = link.hasOwnProperty('disabled') ? link.disabled : link.type == 'delimiter';
        link.html = this.getDropDownItemTemplate(link, item.options['width']);
        link.onClick = event => {
          if (item.name == 'select-box') {
            $(
              '.dx-dropdownmenu-button[title' +
                (item.options.hint ? '="' + item.options.hint + '"' : '') +
                ']'
            ).attr('select-value', event.itemData.text);
          }
          /** if each item has its own click handler - call it */
          (link.action && link.action.call(this, this.getOptions() || event)) ||
            /** if all items use general select handler - call general */
            (item.options.onSelectionChanged &&
              item.options.onSelectionChanged.call(this, this.getOptions() || event));
        };
      });
    }
  }

  checkItemVisible(item) {
    return (
      (!item.hasOwnProperty('visible') || item.visible) &&
      (!item.options ||
        !item.options.items ||
        item.options.items.some(subitem => !subitem.hasOwnProperty('visible') || subitem.visible))
    );
  }

  initToolbarItems() {
    let supportedButtons = this.getSupportedButtons(),
      isSearchEnabled = false,
      items = [];
    if (this._config)
      this._config.forEach((group: ToolbarGroupModel, configIndex: number) => {
        let groupItems = group.items.filter(item => this.checkItemVisible(item)),
          count = groupItems.length;
        groupItems.forEach((item: ToolbarGroupModelItem, index: number) => {
          this.initDropDownMenu(item);
          let internalConfig = supportedButtons[item.name];
          let mergedConfig = _.extend(internalConfig || {}, item.options, {
            onValueChanged: e => {
              if (item.options.onValueChanged) {
                if (item.name === 'search') {
                  this.toolbarComponent.instance.option(
                    `items[${configIndex}].options.value`,
                    e['value']
                  );
                }
                item.options.onValueChanged(e);
              }
            },
          });

          if (item.name == 'search') {
            this.toolbarService.setSearchConfig(item);
            isSearchEnabled = true;
          }

          this.checkItemVisible(item) &&
            items.push({
              name: item.name,
              location: group.location,
              locateInMenu: group.locateInMenu,
              disabled: item.disabled,
              widget:
                (item.text !== undefined || item.html !== undefined) && !item.widget
                  ? null
                  : item.widget || 'dxButton',
              visible:
                (!item.hasOwnProperty('visible') || item.visible) &&
                (!mergedConfig.hasOwnProperty('visible') || mergedConfig.visible),
              text: !item.widget && item.text,
              html: !item.widget && item.html,
              itemTemplate: item.itemTemplate || group.itemTemplate,
              template: item.itemTemplate || mergedConfig.itemTemplate,
              options: _.extend(
                {
                  focusStateEnabled: true,
                  onClick: e => this.toolbarItemAction(item, group, e),
                  elementAttr: _.extend(
                    {
                      'button-pressed': Boolean(
                        mergedConfig &&
                          mergedConfig['checkPressed'] &&
                          mergedConfig['checkPressed'].call(this)
                      ),
                      'group-item-position': ToolbarService.getGroupItemPosition(index, count),
                      'group-item-count': count,
                      'group-item-index': ToolbarService.getGroupItemIndex(index, count),
                    },
                    this.getElementAttr(item)
                  ),
                },
                mergedConfig
              ),
            });
        });
      });

    this.toolbarService.showSearchBox(isSearchEnabled);
    console.log('======== this items ========', this.items);
    this.items = items;
  }

  updateToolbarItemAttribute(itemName: string, property: string, value: any) {
    const toolbarItemIndex = this.items.findIndex(item => item.name === itemName);
    if (toolbarItemIndex !== -1 && this.toolbarComponent) {
      this.toolbarComponent.instance.option(
        `items[${toolbarItemIndex}].options.elementAttr.${property}`,
        value
      );
    }
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
    if (this.fixedSubscription) {
      this.fixedSubscription.unsubscribe();
    }
  }
}
