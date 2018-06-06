import {Component, Injector, OnInit, Input, EventEmitter, Output} from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { FiltersService } from '@shared/filters/filters.service';
import { CustomerStarsServiceProxy, MarkCustomerInput } from '@shared/service-proxies/service-proxies';
import { AppConsts } from '@shared/AppConsts';

@Component({
  selector: 'crm-stars-list',
  templateUrl: './stars-list.component.html',
  styleUrls: ['./stars-list.component.less'],
  providers: [CustomerStarsServiceProxy]
})
export class StarsListComponent extends AppComponentBase implements OnInit {
    @Input() filterModel: any;
    @Input() selectedKeys: any;
    @Input() bulkUpdateMode = false;
    @Input() set selectedItemKey(value) {
        this.selectedItemKeys = [value];
    }
    get selectedItemKey() {
        return this.selectedItemKeys.length ? this.selectedItemKeys[0] : undefined;
    }
    private selectedItemKeys = [];

    @Input() targetSelector = "[aria-label='star-icon']";
    list: any;

    listComponent: any;
    tooltipVisible = false;

    constructor(
        injector: Injector,
        private _filtersService: FiltersService,
        private _starsService: CustomerStarsServiceProxy
    ) {
        super(injector, AppConsts.localization.CRMLocalizationSourceName);
    }

    private deselectAllItems()
    {
        this.listComponent.deselectAll();
        this.selectedItemKeys = [];
    }

    toggle() {
        if (this.tooltipVisible = !this.tooltipVisible)
            this.highlightSelectedFilters();
    }

    apply(selectedKeys = undefined) {
        if (this.listComponent) {
            this.selectedItemKeys = this.listComponent.option('selectedRowKeys');
            this.selectedKeys = selectedKeys || this.selectedKeys;
            if (this.selectedKeys && this.selectedKeys.length) {
                if (this.bulkUpdateMode)
                    this.message.confirm(
                        this.l('BulkUpdateConfirmation', this.selectedKeys.length),
                        isConfirmed => {
                            if (isConfirmed) 
                                this.process();
                            else
                                this.deselectAllItems();
                        }
                    );
                else
                    this.process();
            }
        }
        this.tooltipVisible = false;
    }

    process() {
        this.selectedKeys.forEach((key) => {
            this._starsService.markCustomer(MarkCustomerInput.fromJS({
                customerId: key,
                starId: this.selectedItemKey
            })).finally(() => { 
                if (this.bulkUpdateMode) 
                    this.deselectAllItems(); 
            }).subscribe((result) => {});
        });
    }

    clear() {
        this.deselectAllItems();
        this.apply();
    }

    addActionButton(name, container: HTMLElement, callback) {
        let buttonElement = document.createElement('a');
        buttonElement.innerText = this.l(this.capitalize(name));
        buttonElement.className = 'dx-link dx-link-' + name;
        buttonElement.addEventListener('click', callback);
        container.appendChild(buttonElement);
    }

    clearFiltersHighlight() {
        if (this.listComponent) {
            let elements = this.listComponent.element()
                .getElementsByClassName('filtered');
            while(elements.length)        
                elements[0].classList.remove('filtered');
        }
    }

    onCellPrepared($event) {
        if ($event.rowType === 'data' && $event.column.command === 'edit') {
            if (this.filterModel)
                this.addActionButton('filter', $event.cellElement, (event) => {
                    this.clearFiltersHighlight();

                    let modelItems = this.filterModel.items.element.value;
                    if (modelItems.length == 1 && modelItems[0] == $event.data.id) 
                        this.filterModel.items.element.value = [];
                    else {
                        this.filterModel.items.element.value = [$event.data.id];
                        $event.cellElement.parentElement.classList.add('filtered');
                    }
                    this._filtersService.change(this.filterModel);
                });
        }
    }

    highlightSelectedFilters() {
        let filterIds = this.filterModel && 
            this.filterModel.items.element.value;        
        this.clearFiltersHighlight();
        if (this.listComponent && filterIds && filterIds.length) {
            filterIds.forEach((id) => {
                let row = this.listComponent.getRowElement(
                    this.listComponent.getRowIndexByKey(id));
                if (row && row[0]) row[0].classList.add('filtered');
            });
        }
    }

    onContentReady($event) {
        this.highlightSelectedFilters();
    }

    onInitialized($event) {
        this.listComponent = $event.component;
    }

    onRowClick($event) {
        let key = $event.key;
        this.selectedItemKey = key;
        $event.component.selectRows([key], false);
    }

    ngOnInit() {
        this._starsService.getStars().subscribe((result) => {
            this.list = result;
        });
    }
}
