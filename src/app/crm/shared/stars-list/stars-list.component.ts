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

        this._filtersService.localizationSourceName = this.localizationSourceName;
    }

    toggle() {
        this.tooltipVisible = !this.tooltipVisible;
    }

    apply(selectedKeys = undefined) {
        if (this.listComponent) {
            this.selectedItemKeys = this.list.map((item, index) => {
                return this.listComponent.isItemSelected(index) && item.id;
            }).filter(Boolean);
            this.selectedKeys = selectedKeys || this.selectedKeys;
            if (this.selectedKeys && this.selectedKeys.length) {
                this.selectedKeys.forEach((key) => {
                    this._starsService.markCustomer(MarkCustomerInput.fromJS({
                        customerId: key,
                        starId: this.selectedItemKey
                    })).subscribe((result) => {});
                });
            }
            if (this.bulkUpdateMode)
                setTimeout(() => { this.listComponent.unselectAll(); }, 500);
        }
        this.tooltipVisible = false;
    }

    clear() {
        this.listComponent.unselectAll();
        this.apply();
    }

    onInitialized($event) {
        this.listComponent = $event.component;
    }

    ngOnInit() {
        this._starsService.getStars().subscribe((result) => {
            this.list = result;
        });
    }
}
