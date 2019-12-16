/** Core imports */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewChild } from '@angular/core';
/** Third party imports */
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import DataSource from 'devextreme/data/data_source';
import 'devextreme/data/odata/store';
import { Observable } from 'rxjs';
/** Application imports */
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { AppHttpInterceptor } from '@shared/http/appHttpInterceptor';
import { AppConsts } from '@shared/AppConsts';
import { ContactGroup } from '@shared/AppEnums';
import { ODataService } from '@shared/common/odata/odata.service';
import { ProfileService } from '@shared/common/profile-service/profile.service';
import { DataGridService } from '@app/shared/common/data-grid.service/data-grid.service';
import { ProductsService } from '../products.service';
import { BankCodeServiceType } from '@root/bank-code/products/bank-code-service-type.enum';

@Component({
    selector: 'bank-pass',
    templateUrl: 'bank-pass.component.html',
    styleUrls: ['./bank-pass.component.less'],
    providers: [ ProfileService ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class BankPassComponent {
    @ViewChild(DxDataGridComponent) dataGrid: DxDataGridComponent;
    offerId = 718;
    searchValue: '';
    dataSourceURI = 'Lead';
    gridPagerConfig = DataGridService.defaultGridPagerConfig;
    dataSource = new DataSource({
        requireTotalCount: true,
        store: {
            key: 'Id',
            type: 'odata',
            url: this.getODataUrl(this.dataSourceURI),
            version: AppConsts.ODataVersion,
            beforeSend: (request) => {
                this.dataIsLoading = true;
                this.changeDetectorRef.detectChanges();
                if (this.searchValue) {
                    request.params.quickSearchString = this.searchValue;
                }
                request.params.contactGroupId = ContactGroup.Client;
                request.headers['Authorization'] = 'Bearer ' + abp.auth.getToken();
                request.timeout = AppConsts.ODataRequestTimeoutMilliseconds;
            },
            onLoaded: () => {
                this.dataIsLoading = false;
                this.changeDetectorRef.detectChanges();
            },
            deserializeDates: false,
            paginate: true
        }
    });
    formatting = AppConsts.formatting;
    hasSubscription$: Observable<boolean> = this.productsService.checkServiceSubscription(BankCodeServiceType.BANKPass);
    dataIsLoading = false;

    constructor(
        private oDataService: ODataService,
        private changeDetectorRef: ChangeDetectorRef,
        private productsService: ProductsService,
        public ls: AppLocalizationService,
        public httpInterceptor: AppHttpInterceptor,
        public profileService: ProfileService
    ) {}

    getQuickSearchParam() {
        return this.searchValue ? { name: 'quickSearchString', value: this.searchValue } : null;
    }

    getODataUrl(uri: string, filter?: Object, instanceData = null) {
        const searchParam = this.getQuickSearchParam();
        const params = searchParam && [searchParam];
        return this.oDataService.getODataUrl(uri, filter, instanceData, params);
    }

    searchValueChange(e) {
        if (e.value !== this.searchValue) {
            this.searchValue = e.value;
            this.dataGrid.instance.getDataSource().load();
        }
    }
}