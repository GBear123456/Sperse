import { Component, Injector, OnInit } from '@angular/core';

import { AppComponentBase } from '@shared/common/app-component-base';
import { AppConsts } from '@shared/AppConsts';
import { UserServiceProxy } from '@shared/service-proxies/service-proxies';

@Component({
    selector: 'activity-logs.component',
    templateUrl: './activity-logs.component.html',
    styleUrls: ['./activity-logs.component.less']
})
export class ActivityLogsComponent extends AppComponentBase implements OnInit {
    dataSource: any;
    private readonly dataSourceURI = 'PfmOfferRequest';

    constructor(
        injector: Injector,
        private _userService: UserServiceProxy
    ) {
        super(injector);
        this.dataSource = {
            store: {
                type: 'odata',
                url: this.getODataUrl(this.dataSourceURI),
                version: AppConsts.ODataVersion,
                deserializeDates: false,
                beforeSend: function (request) {
                    request.headers['Authorization'] = 'Bearer ' + abp.auth.getToken();
                },
                paginate: true
            },
            filter: [ 'ApplicantUserId', '=', +this._userService['data'].userId ]
        };
    }

    ngOnInit() {}

    onToolbarPreparing($event) {
        $event.toolbarOptions.items.push({
            location: 'before',
            template: 'title'
        });
    }
}
