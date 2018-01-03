import { ModalDialogComponent } from "shared/common/dialogs/modal/modal-dialog.component";
import { OnInit, OnDestroy, Injector } from "@angular/core";
import { ActivatedRoute } from "@angular/router";

export class CFOModalDialogComponent extends ModalDialogComponent implements OnInit, OnDestroy {
    instanceId: number;
    instanceType: string;

    private sub: any;

    constructor(injector: Injector,
        protected route: ActivatedRoute
    ) {
        super(injector);
    }

    ngOnInit(): void {
        super.ngOnInit();

        this.sub = this.route.params.subscribe(params => {
            let instance = params['instance'];

            if (!(this.instanceId = parseInt(instance))) {
                this.instanceId = undefined;
            }

            this.instanceType = this.capitalize(instance);
        });
    }

    ngOnDestroy(): void {
        this.sub.unsubscribe();
    }
}
