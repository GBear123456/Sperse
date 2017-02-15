import { Component, ViewChild, Injector, Output, EventEmitter, ElementRef } from '@angular/core';
import { ModalDirective } from 'ng2-bootstrap';
import { EditionServiceProxy, EditionEditDto, CreateOrUpdateEditionDto } from '@shared/service-proxies/service-proxies';
import { AppComponentBase } from '@shared/common/app-component-base';
import { AppConsts } from '@shared/AppConsts';
import { FeatureTreeComponent } from '../shared/feature-tree.component';

import * as _ from "lodash";

@Component({
    selector: 'createOrEditEditionModal',
    templateUrl: './create-or-edit-edition-modal.component.html'
})
export class CreateOrEditEditionModalComponent extends AppComponentBase {

    @ViewChild('editionNameInput') editionNameInput: ElementRef;
    @ViewChild('createOrEditModal') modal: ModalDirective;
    @ViewChild('featureTree') featureTree: FeatureTreeComponent;

    @Output() modalSave: EventEmitter<any> = new EventEmitter<any>();

    active: boolean = false;
    saving: boolean = false;

    edition: EditionEditDto = new EditionEditDto();

    constructor(
        injector: Injector,
        private _editionService: EditionServiceProxy
    ) {
        super(injector);
    }

    show(editionId?: number): void {
        let self = this;
        self.active = true;

        self._editionService.getEditionForEdit(editionId).subscribe(result => {
            self.edition = result.edition;
            self.featureTree.editData = result;

            self.modal.show();
        });
    }

    onShown(): void {
        $(this.editionNameInput.nativeElement).focus();
    }

    save(): void {
        let self = this;

        var input = new CreateOrUpdateEditionDto();
        input.edition = self.edition;
        input.featureValues = self.featureTree.getGrantedFeatures();

        this.saving = true;
        this._editionService.createOrUpdateEdition(input)
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