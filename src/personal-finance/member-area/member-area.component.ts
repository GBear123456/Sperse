import { Component, OnInit, ComponentFactoryResolver } from '@angular/core';

import { PersonalFinanceLayoutService } from '@shared/personal-finance-layout/personal-finance-layout.service';
import { UserManagementListComponent } from '../shared/layout/user-management-list/user-management-list.component';


@Component({
  selector: 'app-root',
  templateUrl: 'member-area.component.html',
  styleUrls: ['member-area.component.less']
})

export class MemberAreaComponent implements OnInit {
    constructor(
        private pfmLayoutService: PersonalFinanceLayoutService,
        private componentFactoryResolver: ComponentFactoryResolver
    ) { 
        this.pfmLayoutService.headerContentUpdate(
            this.componentFactoryResolver.resolveComponentFactory(UserManagementListComponent)
        );
    }

    ngOnInit() {
    }
}
