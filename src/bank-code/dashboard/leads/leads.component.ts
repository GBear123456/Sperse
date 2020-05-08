/** Core imports */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewChild } from '@angular/core';
import { Router } from '@angular/router';

/** Third party imports */
import { first } from 'rxjs/operators';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import DataSource from 'devextreme/data/data_source';
import 'devextreme/data/odata/store';
import ODataStore from 'devextreme/data/odata/store';

/** Application imports */
import { BankCodeService } from '@app/shared/common/bank-code/bank-code.service';
import { AppHttpInterceptor } from '@shared/http/appHttpInterceptor';
import { AppLocalizationService } from '../../../app/shared/common/localization/app-localization.service';
import { AppConsts } from '@shared/AppConsts';
import { ODataService } from '@shared/common/odata/odata.service';
import { ContactGroup } from '@shared/AppEnums';
import { UrlHelper } from '@shared/helpers/UrlHelper';
import { ProfileService } from '../../../shared/common/profile-service/profile.service';

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
    @ViewChild(DxDataGridComponent, { static: false }) dataGrid: DxDataGridComponent;
    totalCount: number;
    stubData = [
        {
            'Id': 1,
            'Name': 'John Smith',
            'BankCode': 'BKAN',
            'Email': 'johnsmith@gmail.com',
            'Phone': '502-859-3321'
        },
        {
            'Id': 2,
            'Name': 'Caleb Troll',
            'BankCode': 'ABNK',
            'Email': 'calebt@gmail.com',
            'Phone': '302-559-3181'
        },
        {
            'Id': 3,
            'Name': 'Paula Goldman',
            'BankCode': 'KNAB',
            'Email': 'goldmanp@gmail.com',
            'Phone': '295-050-2285'
        },
        {
            'Id': 4,
            'Name': 'Mike Danza',
            'BankCode': 'ANKB',
            'Email': 'mike952@gmail.com',
            'Phone': '502-859-3321'
        },
        {
            'Id': 5,
            'Name': 'Tony Montoya',
            'BankCode': 'BNKA',
            'Email': 't.montoya@gmail.com',
            'Phone': '607-184-1145'
        },
    ];
    items = [];
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
        store: new ODataStore({
            key: 'Id',
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
            onLoaded: (items: any[]) => {
                this.totalCount = items.length;
                this.items = items.length ? items : this.stubData;
                this.changeDetectorRef.detectChanges();
            },
            deserializeDates: false
        })
    });
    constructor(
        private bankCodeService: BankCodeService,
        private oDataService: ODataService,
        private router: Router,
        private profileService: ProfileService,
        private changeDetectorRef: ChangeDetectorRef,
        public httpInterceptor: AppHttpInterceptor,
        public ls: AppLocalizationService
    ) {
        this.dataSource.load();
    }

    generateFirstLead() {
        this.profileService.trackingLink$.pipe(first()).subscribe(
            (trackingLink: string) => window.open(trackingLink, '_blank')
        );
    }

    followUp(data) {
        console.log(data);
    }

    viewMore() {
        this.router.navigate(
            ['code-breaker', 'products', 'bankpass'],
            { queryParams: { 'showLeads': 'true' }}
        )
    }
}