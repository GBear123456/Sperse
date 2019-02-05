import { AppModalDialogComponent } from '@app/shared/common/dialogs/modal/app-modal-dialog.component';
import { Component, Injector } from '@angular/core';

@Component({
    templateUrl : './cfo-modal-dialog.component.html',
    styleUrls: ['./cfo-modal-dialog.component.less']
  })
export class CFOModalDialogComponent extends AppModalDialogComponent {
    instanceId: number;
    instanceType: string;

    constructor(injector: Injector) {
        super(injector);
        this.instanceType = this.data.instanceType;
        this.instanceId = this.data.instanceId;
    }
}
