import { Component, OnInit, Injector, Output, EventEmitter } from '@angular/core';
import { MatDialog } from '@angular/material';
import { AppComponentBase } from '@shared/common/app-component-base';
import { UserServiceProxy, GetUserForEditOutput } from '@shared/service-proxies/service-proxies';

@Component({
    selector: 'details-header',
    templateUrl: './details-header.component.html',
    styleUrls: ['./details-header.component.less']
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
