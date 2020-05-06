/** Core imports */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Router } from '@angular/router';

/** Third party imports */
import { map } from 'rxjs/operators';
import DataSource from 'devextreme/data/data_source';
import 'devextreme/data/odata/store';

/** Application imports */
import { BankCodeService } from '@app/shared/common/bank-code/bank-code.service';
import { AppHttpInterceptor } from '@shared/http/appHttpInterceptor';
import { AppLocalizationService } from '../../../app/shared/common/localization/app-localization.service';
import { AppConsts } from '@shared/AppConsts';
import { ODataService } from '@shared/common/odata/odata.service';
import { ContactGroup } from '@shared/AppEnums';
import { UrlHelper } from '@shared/helpers/UrlHelper';

@Component({
    selector: 'leads',
    templateUrl: 'leads.component.html',
    styleUrls: [
        '../../shared/styles/view-more-button.less',
        'leads.component.less'
    ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class LeadsComponent {
    noClients$ = this.bankCodeService.getClientsBankCodesTotalCount().pipe(
        map((clientsCount: number) => !clientsCount)
    );
    dataSource = new DataSource({
        requireTotalCount: false,
        pageSize: 5,
        select: [
            'Id',
            'Name',
            'Email',
            'Phone',
            'BankCode'
        ],
        sort: [{ selector: 'Id', desc: true }],
        store: {
            key: 'Id',
            type: 'odata',
            url: this.oDataService.getODataUrl('Lead'),
            version: AppConsts.ODataVersion,
            beforeSend: (request) => {
                request.params.contactGroupId = ContactGroup.Client;
                request.params.$count = true;
                const queryParams = UrlHelper.getQueryParameters();
                if (queryParams['user-key']) {
                    request.headers['user-key'] = queryParams['user-key'];
                    if (queryParams['tenantId']) {
                        request.params['tenantId'] = queryParams['tenantId'];
                    }
                } else {
                    request.headers['Authorization'] = 'Bearer ' + abp.auth.getToken();
                }
                request.timeout = AppConsts.ODataRequestTimeoutMilliseconds;
            },
            deserializeDates: false,
            paginate: false
        },
        onChanged: () => {
            // this.dataIsLoading = false;
            // this.gridInitialized = true;
            // this.changeDetectorRef.detectChanges();
        }
    });
    constructor(
        private bankCodeService: BankCodeService,
        private oDataService: ODataService,
        private router: Router,
        public httpInterceptor: AppHttpInterceptor,
        public ls: AppLocalizationService
    ) {
        window['t'] = this;
    }

    generateFirstLead() {

    }

    followUp(data) {
        console.log(data);
    }

    viewMore() {
        this.router.navigateByUrl(
            'code-breaker/products/bankpass',
            { queryParams: { showLeads: 'true' }}
        )
    }
}