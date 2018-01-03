import { AppComponentBase } from "shared/common/app-component-base";
import { OnInit, OnDestroy, Injector } from "@angular/core";
import { ActivatedRoute } from "@angular/router";

export abstract class CFOComponentBase extends AppComponentBase implements OnInit, OnDestroy {
    instanceId: number;
    instanceType: string;

    private sub: any;

    constructor(injector: Injector,
        protected route: ActivatedRoute
    ) {
        super(injector);
    }

    ngOnInit(): void {
        this.sub = this.route.params.subscribe(params => {
            let instance = params['instance'];

            if (!(this.instanceId = parseInt(instance))) {
                this.instanceId = undefined;
            }

            this.instanceType = this.capitalize(instance);
        });
    }

    ngOnDestroy() {
        this.sub.unsubscribe();
    }

    getODataURL(uri: String, filter?: Object) {
        let url = super.getODataURL(uri, filter) + "?";

        if (this.instanceType !== undefined)
            url += "instanceType=" + encodeURIComponent("" + this.instanceType) + "&";

        if (this.instanceId !== undefined)
            url += "instanceId=" + encodeURIComponent("" + this.instanceId) + "&";

        return url;
    }
}
