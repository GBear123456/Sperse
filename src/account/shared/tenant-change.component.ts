import { Component, OnInit, ViewChild } from '@angular/core';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { TenantChangeModalComponent } from './tenant-change-modal.component';
import { AppLocalizationService } from '../../app/shared/common/localization/app-localization.service';

@Component({
    selector: 'tenant-change',
    template:
    `<span *ngIf="isMultiTenancyEnabled">
        {{ls.l("CurrentTenant")}}: <span *ngIf="tenancyName" [title]="name"><strong>{{tenancyName}}</strong></span> <span *ngIf="!tenancyName">{{ls.l("NotSelected")}}</span> (<a href="javascript:;" (click)="showChangeModal()">{{ls.l("Change")}}</a>)
        <tenantChangeModal #tenantChangeModal></tenantChangeModal>
    </span>`
})
export class TenantChangeComponent implements OnInit {
    @ViewChild('tenantChangeModal') tenantChangeModal: TenantChangeModalComponent;

    tenancyName: string;
    name: string;

    constructor(
        private appSessionService: AppSessionService,
        public ls: AppLocalizationService
    ) {}

    ngOnInit() {
        if (this.appSessionService.tenant) {
            this.tenancyName = this.appSessionService.tenant.tenancyName;
            this.name = this.appSessionService.tenant.name;
        }
    }

    get isMultiTenancyEnabled(): boolean {
        return abp.multiTenancy.isEnabled;
    }

    showChangeModal(): void {
        this.tenantChangeModal.show(this.tenancyName);
    }
}
