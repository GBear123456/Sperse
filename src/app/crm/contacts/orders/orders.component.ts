/** Core imports */
import {
    Component,
    OnInit,
    OnDestroy,
    Injector,
    ViewChild
} from '@angular/core';

/** Third party imports */
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { AppComponentBase } from '@shared/common/app-component-base';
import { FilterModel } from '@shared/filters/models/filter.model';
import { ContactServiceProxy, OrderServiceProxy } from '@shared/service-proxies/service-proxies';

@Component({
    templateUrl: './orders.component.html',
    styleUrls: ['./orders.component.less'],
    animations: [appModuleAnimation()],
    providers: [ OrderServiceProxy ]
})
export class OrdersComponent extends AppComponentBase implements OnInit, OnDestroy {
    @ViewChild(DxDataGridComponent) dataGrid: DxDataGridComponent;
    private readonly dataSourceURI = 'Order';
    private filters: FilterModel[];
    private formatting = AppConsts.formatting;

    constructor(injector: Injector,
                private _contactService: ContactServiceProxy,
                private orderServiceProxy: OrderServiceProxy
    ) {
        super(injector, AppConsts.localization.CRMLocalizationSourceName);
        this.dataSource = {
            uri: this.dataSourceURI,
            requireTotalCount: true,
            filter: [ 'ContactId', '=', +this._contactService['data'].contactInfo.id ],
            store: {
                key: 'Id',
                type: 'odata',
                url: this.getODataUrl(this.dataSourceURI),
                version: AppConsts.ODataVersion,
                beforeSend: function (request) {
                    request.headers['Authorization'] = 'Bearer ' + abp.auth.getToken();
                },
                onLoaded: () => {
                    this.dataGrid.instance.cancelEditData();
                    this.dataGrid.instance.endCustomLoading();
                },
                deserializeDates: false,
                paginate: true
            }
        };
    }

    onContentReady(event) {
        this.setGridDataLoaded();
        event.component.columnOption('command:edit', {
            visibleIndex: -1,
            width: 40
        });
    }

    ngOnInit(): void {
        this.processFilterInternal();
    }

    processFilterInternal() {
        if (this.dataGrid && this.dataGrid.instance) {
            this.processODataFilter(
                this.dataGrid.instance,
                this.dataSourceURI,
                this.filters,
                (filter) => {
                    let filterMethod = this['filterBy' +
                    this.capitalize(filter.caption)];
                    if (filterMethod)
                        return filterMethod.call(this, filter);
                }
            );
        }
    }

    onRowUpdating(e) {
        if (e.newData.Amount !== e.oldData.Amount) {
            e.cancel = true;
            this.dataGrid.instance.beginCustomLoading('');
            this.orderServiceProxy.setAmount(e.oldData.Id, e.newData.Amount).subscribe(
                () => this.processFilterInternal()
            );
        }
    }

}
