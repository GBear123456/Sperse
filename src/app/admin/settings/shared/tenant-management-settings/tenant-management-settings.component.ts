/** Core imports */
import { Component, ChangeDetectionStrategy, Injector } from '@angular/core';

/** Third party imports */
import { forkJoin, Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';

/** Application imports */
import {
    ComboboxItemDto,
    CommonLookupServiceProxy,
    HostSettingsServiceProxy,
    TenantManagementSettingsEditDto
} from '@shared/service-proxies/service-proxies';
import { SettingsComponentBase } from './../settings-base.component';

@Component({
    selector: 'tenant-management-settings',
    templateUrl: './tenant-management-settings.component.html',
    styleUrls: ['./tenant-management-settings.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [HostSettingsServiceProxy]
})
export class TenantManagementSettingsComponent extends SettingsComponentBase {
    tenantManagementSettings: TenantManagementSettingsEditDto;
    editions: ComboboxItemDto[] = undefined;

    constructor(
        _injector: Injector,
        private hostSettingsService: HostSettingsServiceProxy,
        private commonLookupService: CommonLookupServiceProxy,
    ) {
        super(_injector);
    }

    ngOnInit(): void {
        this.startLoading();
        forkJoin(
            this.hostSettingsService.getTenantManagementSettings(),
            this.commonLookupService.getEditionsForCombobox(false)
        )
            .pipe(
                finalize(() => this.finishLoading())
            )
            .subscribe(([tenantManagement, editions]) => {
                this.tenantManagementSettings = tenantManagement;
                this.initEditions(editions.items);
                this.changeDetection.detectChanges();
            });
    }

    initEditions(items): void {
        this.editions = items;

        const notAssignedEdition = new ComboboxItemDto();
        notAssignedEdition.value = '';
        notAssignedEdition.displayText = this.l('NotAssigned');

        this.editions.unshift(notAssignedEdition);
    }

    getSaveObs(): Observable<any> {
        return this.hostSettingsService.updateTenantManagementSettings(this.tenantManagementSettings);
    }
}