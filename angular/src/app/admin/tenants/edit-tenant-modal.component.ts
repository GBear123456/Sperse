import { Component, ViewChild, Injector, Output, EventEmitter, ElementRef } from '@angular/core';
import { ModalDirective } from 'ng2-bootstrap';
import { TenantServiceProxy, CommonLookupServiceProxy, TenantEditDto, ComboboxItemDto } from '@shared/service-proxies/service-proxies';
import { AppComponentBase } from '@shared/common/app-component-base';
import { AppConsts } from '@shared/AppConsts';
import { FeatureTreeComponent } from '../shared/feature-tree.component';

import * as _ from "lodash";

@Component({
    selector: 'editTenantModal',
    templateUrl: './edit-tenant-modal.component.html'
})
export class EditTenantModalComponent extends AppComponentBase {

    @ViewChild('nameInput') nameInput: ElementRef;
    @ViewChild('editModal') modal: ModalDirective;

    @Output() modalSave: EventEmitter<any> = new EventEmitter<any>();

    active: boolean = false;
    saving: boolean = false;

    tenant: TenantEditDto = undefined;
    currentConnectionString: string;
    editions: ComboboxItemDto[] = [];

    constructor(
        injector: Injector,
        private _tenantService: TenantServiceProxy,
        private _commonLookupService: CommonLookupServiceProxy
    ) {
        super(injector);
    }

    show(tenantId: number): void {
        this.active = true;

        this._commonLookupService.getEditionsForCombobox().subscribe(result => {
            this.editions = result.items;
            var notSelectedEdition = new ComboboxItemDto();
            notSelectedEdition.displayText = this.l('NotAssigned');
            notSelectedEdition.value = "";
            this.editions.unshift(notSelectedEdition);

            this._tenantService.getTenantForEdit(tenantId).subscribe((result) => {
                this.tenant = result;
                this.currentConnectionString = result.connectionString;
                this.tenant.editionId = this.tenant.editionId || 0;
                this.modal.show();
            });
        });
    }

    onShown(): void {
        $(this.nameInput.nativeElement).focus();
    }

    save(): void {
        if (this.tenant.editionId === 0) {
            this.tenant.editionId = null;
        }

        this.saving = true;
        this._tenantService.updateTenant(this.tenant)
            .finally(() => this.saving = false)
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
}