import { ModalDialogComponent } from "shared/common/dialogs/modal/modal-dialog.component";
import { OnInit, OnDestroy, Injector } from "@angular/core";
import { ActivatedRoute } from "@angular/router";

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
