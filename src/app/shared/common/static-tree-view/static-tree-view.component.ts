/** Core imports */
import { Component, Input, EventEmitter, Output, HostBinding, ViewChild, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';

/** Third party imports */
import { DxTreeViewComponent } from 'devextreme-angular/ui/tree-view';
import { DxTooltipComponent } from 'devextreme-angular/ui/tooltip';
import { DxTabsComponent } from 'devextreme-angular/ui/tabs';
import startCase from 'lodash/startCase';
import * as _ from 'underscore';

/** Application imports */
import { FiltersService } from '@shared/filters/filters.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { FilterModel } from '@shared/filters/models/filter.model';

@Component({
    selector: 'app-static-tree-view',
    templateUrl: './static-tree-view.component.html',
    styleUrls: ['./static-tree-view.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class StaticTreeViewComponent {
    @ViewChild('staticTreeView', { static: false }) dxTreeView: DxTreeViewComponent;
    @ViewChild(DxTooltipComponent, { static: true }) dxTooltip: DxTooltipComponent;
    @Output() onApply: EventEmitter<any> = new EventEmitter();
    @Input() width: string = '100%';
    @Input() height: any = 'auto';
    @Input() listHeight: string = 'calc(100% - 30px)';
    @Input() accessKey: string;
    @Input() title: string;
    @Input() showTitle = true;
    @Input() filterModel: FilterModel;
    @Input() selectedKeys: any[];
    @Input() targetSelector: string;
    @Input() showCheckBoxesMode = 'none';
    @Input() selectionMode = 'multiple';
    @Input() hideButtons = true;
    @Input() hideApplyForEmpty = true;
    @Input() searchEnabled = false;
    @Input() searchExprType = 'displayName';
    @Input() convertNameStartCase = true;
    @Input() disabled = false;
    @Input('list')
    set list(value: any[]) {
        this._list = (value ? value.map((item) => {
            return _.extend(item, {
                displayName: this.convertNameStartCase ? startCase(item.name.toLowerCase()) : item.name
            });
        }) : (value || [])).filter((item) => !!item.name);
    }
    get list(): any[] {
        return this._list;
    }

    tooltipVisible: boolean;
    selectedItemKeys: any[] = [];
    private _list: any[];

    constructor(
        private filtersService: FiltersService,
        private changeDetectorRef: ChangeDetectorRef,
        public ls: AppLocalizationService
    ) { }

    toggle() {
        if (this.tooltipVisible = !this.tooltipVisible)
            this.setSelectedItems();

        this.changeDetectorRef.detectChanges();
        return this.tooltipVisible;
    }

    apply() {
        if (!this.hideApplyForEmpty || this.selectedItemKeys && this.selectedItemKeys.length)
            this.onApply.emit(this.selectedItemKeys);

        this.applyToFilterModel();
        this.tooltipVisible = false;
        this.changeDetectorRef.detectChanges();
    }

    onInitialized() {
        this.setSelectedItems();
    }

    onSelectionChanged(event) {
        this.selectedItemKeys = event.component.getSelectedNodesKeys();
    }

    setSelectedItems() {
        if (!this.filterModel)
            return;

        let filterSelectedIds: any[] = this.filterModel.items.element.value;
        if (this.dxTreeView && filterSelectedIds) {
            this.dxTreeView.instance.unselectAll();
            this.selectedItemKeys = filterSelectedIds;
            filterSelectedIds.forEach(id => this.dxTreeView.instance.selectItem(id));
        }
    }

    clearSelection() {
        this.dxTreeView.instance.unselectAll();
        this.apply();
    }

    applyToFilterModel() {
        if (this.filterModel) {
            this.filterModel.items.element.value = this.selectedItemKeys;
            this.filtersService.change([this.filterModel]);
        }
    }
}