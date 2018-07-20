import { ModalDialogComponent } from 'app/shared/common/dialogs/modal/modal-dialog.component';
import { Component, OnInit, OnDestroy, Injector } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
    templateUrl : './cfo-modal-dialog.component.html',
    styleUrls: ['./cfo-modal-dialog.component.less']
  })
export class CFOModalDialogComponent extends ModalDialogComponent {
    instanceId: number;
    instanceType: string;

    constructor(injector: Injector
    ) {
        super(injector);

        this.instanceType = this.data.instanceType;
        this.instanceId = this.data.instanceId;
    }
}
