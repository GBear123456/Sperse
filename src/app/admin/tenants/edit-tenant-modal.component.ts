import { Component, ElementRef, EventEmitter, Injector, Output, ViewChild } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { CommonLookupServiceProxy, SubscribableEditionComboboxItemDto, TenantEditDto, TenantEditEditionDto, TenantServiceProxy } from '@shared/service-proxies/service-proxies';
import * as _ from 'lodash';
import * as moment from 'moment';
import { ModalDirective } from 'ngx-bootstrap';
import { finalize } from 'rxjs/operators';

@Component({
    selector: 'editTenantModal',
    templateUrl: './edit-tenant-modal.component.html'
})
export class EditTenantModalComponent extends AppComponentBase {

    @ViewChild('nameInput') nameInput: ElementRef;
    @ViewChild('editModal') modal: ModalDirective;
    @ViewChild('SubscriptionEndDateUtc') subscriptionEndDateUtc: ElementRef;

    @Output() modalSave: EventEmitter<any> = new EventEmitter<any>();

    active = false;
    saving = false;
    isUnlimited = false;
    subscriptionEndDateUtcIsValid = false;

    tenant: TenantEditDto = undefined;
    tenantEditionId = 0;
    currentConnectionString: string;
    editions: SubscribableEditionComboboxItemDto[] = [];
    isSubscriptionFieldsVisible = false;

    constructor(
        injector: Injector,
        private _tenantService: TenantServiceProxy,
        private _commonLookupService: CommonLookupServiceProxy
    ) {
        super(injector);
    }

    show(tenantId: number): void {
        this.active = true;

        this._commonLookupService.getEditionsForCombobox(false).subscribe(editionsResult => {
            this.editions = editionsResult.items;

            let notSelectedEdition = new SubscribableEditionComboboxItemDto();
            notSelectedEdition.displayText = this.l('NotAssigned');
            notSelectedEdition.value = '0';
            this.editions.unshift(notSelectedEdition);

            this._tenantService.getTenantForEdit(tenantId).subscribe((tenantResult) => {
                this.tenant = tenantResult;
                this.currentConnectionString = tenantResult.connectionString;

                this.tenantEditionId = this.tenant.editions && this.tenant.editions.length > 0 ? this.tenant.editions[0].editionId : 0;
                this.isUnlimited = true;
                this.subscriptionEndDateUtcIsValid = this.isUnlimited;
                this.modal.show();
                this.toggleSubscriptionFields();
            });
        });
    }

    onShown(): void {
        $(this.nameInput.nativeElement).focus();
        $(this.subscriptionEndDateUtc.nativeElement).datetimepicker({
            locale: abp.localization.currentLanguage.name,
            format: 'L',
            defaultDate: null,
        }).on('dp.change', (e) => {
            this.subscriptionEndDateUtcIsValid = e.date !== false;
        });
    }

    formatSubscriptionEndDate(date: any): string {
        if (this.isUnlimited) {
            return '';
        }

        if (!this.tenantEditionId) {
            return '';
        }

        if (!date) {
            return '';
        }

        return moment(date).format('L');
    }

    selectedEditionIsFree(): boolean {
        if (!this.tenantEditionId) {
            return true;
        }

        let selectedEditions = _.filter(this.editions, { value: this.tenantEditionId + '' });
        if (selectedEditions.length !== 1) {
            return true;
        }

        let selectedEdition = selectedEditions[0];
        return selectedEdition.isFree;
    }

    save(): void {
        this.saving = true;
        if (this.tenantEditionId === 0) {
            this.tenant.editions = null;
        } else {
            this.tenant.editions = [TenantEditEditionDto.fromJS({ editionId: this.tenantEditionId })];
        }

        this._tenantService.updateTenant(this.tenant)
            .pipe(finalize(() => this.saving = false))
            .subscribe(() => {
                this.notify.info(this.l('SavedSuccessfully'));
                this.close();
                this.modalSave.emit(null);
            });
    }

    close(): void {
        this.active = false;
        this.modal.hide();
    }

    onEditionChange(): void {
        this.toggleSubscriptionFields();
    }

    onUnlimitedChange(): void {
        if (this.isUnlimited) {
            $(this.subscriptionEndDateUtc.nativeElement).data('DateTimePicker').clear();
            this.subscriptionEndDateUtcIsValid = true;
        } else {
            let date = $(this.subscriptionEndDateUtc.nativeElement).data('DateTimePicker').date();
            if (!date) {
                this.subscriptionEndDateUtcIsValid = false;
            }
        }
    }

    toggleSubscriptionFields() {
        if (this.tenantEditionId > 0) {
            this.isSubscriptionFieldsVisible = true;
        } else {
            this.isSubscriptionFieldsVisible = false;
        }
    }
}
