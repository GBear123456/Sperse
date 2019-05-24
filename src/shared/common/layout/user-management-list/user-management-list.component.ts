/** Core imports */
import { Component, OnInit, ViewEncapsulation } from '@angular/core';

/** Application imports */
import { AppSessionService } from 'shared/common/session/app-session.service';
@Component({
    selector: 'user-management-list',
    templateUrl: './user-management-list.component.html',
    styleUrls: [
        '../../../metronic/m-top-bar.less',
        '../../../metronic/m-dropdown.less',
        '../../../metronic/m-d.less',
        '../../../metronic/m-stack.less',
        '../../../metronic/m-nav.less',
        '../../../metronic/m-badge.less',
        '../../../metronic/m-scrollable.less',
        '../../../metronic/m-list-timeline.less',
        './user-management-list.component.less'
    ],
    encapsulation: ViewEncapsulation.None
})
export class UserManagementListComponent implements OnInit {
    loggedUserId: number;

    constructor(public appSession: AppSessionService) {}

    ngOnInit() {
        this.loggedUserId = this.appSession.userId;
    }
}
