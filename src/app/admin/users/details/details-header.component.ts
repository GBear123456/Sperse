import { Component, OnInit, Injector, Input, Output, EventEmitter } from '@angular/core';
import { MatDialog } from '@angular/material';
import { AppComponentBase } from '@shared/common/app-component-base';
import { AppConsts } from '@shared/AppConsts';
import { InstanceServiceProxy, TenantHostType, UserServiceProxy, GetUserForEditOutput } from '@shared/service-proxies/service-proxies';

import * as _ from 'underscore';

@Component({
    selector: 'details-header',
    templateUrl: './details-header.component.html',
    styleUrls: ['./details-header.component.less'],
    providers: [InstanceServiceProxy]
})
export class DetailsHeaderComponent extends AppComponentBase implements OnInit {
    @Output() onUpdate: EventEmitter<any> = new EventEmitter();

    data: GetUserForEditOutput;

    constructor(
        injector: Injector,
        public dialog: MatDialog,
        private _userService: UserServiceProxy
    ) {
        super(injector);
    }

    ngOnInit(): void {
        this.data = this._userService['data'];
    }
}
