import {Component, Injector, OnInit, Input, EventEmitter, Output} from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { FiltersService } from '@shared/filters/filters.service';
import { UserAssignmentServiceProxy, AssignUserToCustomerInput, UserInfoDto } from '@shared/service-proxies/service-proxies';
import { AppConsts } from '@shared/AppConsts';

@Component({
  selector: 'crm-user-assignment-list',
  templateUrl: './user-assignment-list.component.html',
  styleUrls: ['./user-assignment-list.component.less'],
  providers: [UserAssignmentServiceProxy]
})
export class UserAssignmentComponent extends AppComponentBase implements OnInit {
    @Input() selectedKeys: any;
    @Input() targetSelector = "[aria-label='Assign']";
    @Input() bulkUpdateMode = false;
    @Input() set selectedItemKey(value) {
        this.selectedItemKeys = [value];
    }
    list: any;
    selectedItemKeys = [];

    listComponent: any;
    tooltipVisible = false;

    constructor(
        injector: Injector,
        private _filtersService: FiltersService,
        private _tagsService: UserAssignmentServiceProxy
    ) {
        super(injector, AppConsts.localization.CRMLocalizationSourceName);

        this._filtersService.localizationSourceName = this.localizationSourceName;
    }

    toggle() {
        this.tooltipVisible = !this.tooltipVisible;
    }

    apply(selectedKeys = undefined) {
        this.selectedKeys = selectedKeys || this.selectedKeys;
        if (this.listComponent && this.selectedKeys && this.selectedKeys.length) {
            let selectedItems = this.list.map((item, index) => {
                return this.listComponent.isItemSelected(index) && item;
            }).filter(Boolean);
            let userId = selectedItems.length > 0 ? selectedItems[0].id : undefined;
            this.selectedKeys.forEach((key) => {
                this._tagsService.assignUserToCustomer(AssignUserToCustomerInput.fromJS({
                    customerId: key,
                    userId: userId
                })).subscribe((result) => {});
            });
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
        this._tagsService.getUsers().subscribe((result) => {
            this.list = result;
        });
    }
}
