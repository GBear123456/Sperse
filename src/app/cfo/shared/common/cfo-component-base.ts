import { AppComponentBase } from "shared/common/app-component-base";
import { OnInit, OnDestroy, Injector } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { InstanceType } from "shared/service-proxies/service-proxies";

export abstract class CFOComponentBase extends AppComponentBase implements OnInit, OnDestroy {
    instanceId: number;
    instanceType: string;

    private _sub: any;

    constructor(injector: Injector,
        protected _route: ActivatedRoute
    ) {
        super(injector);
    }

    ngOnInit(): void {
        this._sub = this._route.params.subscribe(params => {
            let instance = params['instance'];

            if (!(this.instanceId = parseInt(instance))) {
                this.instanceId = undefined;
            }

            this.instanceType = this.capitalize(instance);

            this.loadData();
        });
    }

    ngOnDestroy() {
        this._sub.unsubscribe();
    }

    loadData(): void {
    }

    getODataURL(uri: String, filter?: Object) {
        let url = super.getODataURL(uri, filter) + "?";

        if (this.instanceType !== undefined && InstanceType[this.instanceType] !== undefined) {
            url += "instanceType=" + encodeURIComponent("" + InstanceType[this.instanceType]) + "&";
        }

        if (this.instanceId !== undefined) {
            url += "instanceId=" + encodeURIComponent("" + this.instanceId) + "&";
        }

        return url;
    }
}
