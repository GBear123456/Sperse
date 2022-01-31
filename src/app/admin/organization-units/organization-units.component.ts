import { Component, Inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { OrganizationTreeComponent } from './organization-tree/organization-tree.component';
import { OrganizationUnitMembersComponent } from './organization-unit-members/organization-unit-members.component';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';

@Component({
    templateUrl: './organization-units.component.html',
    styleUrls: ['./organization-units.component.less'],
})
export class OrganizationUnitsComponent implements OnInit, OnDestroy {
    @ViewChild('ouMembers') ouMembers: OrganizationUnitMembersComponent;
    @ViewChild('ouTree') ouTree: OrganizationTreeComponent;

    constructor(
        public ls: AppLocalizationService,
        @Inject(DOCUMENT) private document: any
    ) {}

    ngOnInit() {
        this.document.body.classList.add('overflow-hidden');
    }

    ngOnDestroy() {
        this.document.body.classList.remove('overflow-hidden');
    }
}
