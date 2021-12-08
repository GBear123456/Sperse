/** Core imports */
import { ChangeDetectorRef, Component, ElementRef, EventEmitter, Output, ViewChild } from '@angular/core';

/** Third party imports */
import { ModalDirective } from 'ngx-bootstrap';
import { finalize } from 'rxjs/operators';

/** Application imports */
import { CreateOrganizationUnitInput, OrganizationUnitDto, OrganizationUnitServiceProxy, UpdateOrganizationUnitInput } from '@shared/service-proxies/service-proxies';
import { NotifyService } from 'abp-ng2-module/dist/src/notify/notify.service';
import { AppLocalizationService } from '../../../shared/common/localization/app-localization.service';

export interface IOrganizationUnitOnEdit {
    id?: number;
    parentId?: number;
    displayName?: string;
}

@Component({
    selector: 'createOrEditOrganizationUnitModal',
    templateUrl: './create-or-edit-unit-modal.component.html'
})
export class CreateOrEditUnitModalComponent {
    @ViewChild('createOrEditModal') modal: ModalDirective;
    @ViewChild('organizationUnitDisplayName') organizationUnitDisplayNameInput: ElementRef;
    @Output() unitCreated: EventEmitter<OrganizationUnitDto> = new EventEmitter<OrganizationUnitDto>();
    @Output() unitUpdated: EventEmitter<OrganizationUnitDto> = new EventEmitter<OrganizationUnitDto>();

    active = false;
    saving = false;
    organizationUnit: IOrganizationUnitOnEdit = {};

    constructor(
        private organizationUnitService: OrganizationUnitServiceProxy,
        private changeDetector: ChangeDetectorRef,
        private notify: NotifyService,
        public ls: AppLocalizationService
    ) {}

    onShown(): void {
        $(this.organizationUnitDisplayNameInput.nativeElement).focus();
    }

    show(organizationUnit: IOrganizationUnitOnEdit): void {
        this.organizationUnit = organizationUnit;
        this.active = true;
        this.modal.show();
        this.changeDetector.detectChanges();
    }

    save(): void {
        if (!this.organizationUnit.id) {
            this.createUnit();
        } else {
            this.updateUnit();
        }
    }

    createUnit() {
        const createInput = new CreateOrganizationUnitInput();
        createInput.parentId = this.organizationUnit.parentId;
        createInput.displayName = this.organizationUnit.displayName;

        this.saving = true;
        this.organizationUnitService
            .createOrganizationUnit(createInput)
            .pipe(finalize(() => this.saving = false))
            .subscribe((result: OrganizationUnitDto) => {
                this.notify.info(this.ls.l('SavedSuccessfully'));
                this.close();
                this.unitCreated.emit(result);
            });
    }

    updateUnit() {
        const updateInput = new UpdateOrganizationUnitInput();
        updateInput.id = this.organizationUnit.id;
        updateInput.displayName = this.organizationUnit.displayName;

        this.saving = true;
        this.organizationUnitService
            .updateOrganizationUnit(updateInput)
            .pipe(finalize(() => this.saving = false))
            .subscribe((result: OrganizationUnitDto) => {
                this.notify.info(this.ls.l('SavedSuccessfully'));
                this.close();
                this.unitUpdated.emit(result);
            });
    }

    close(): void {
        this.modal.hide();
        this.active = false;
    }
}
