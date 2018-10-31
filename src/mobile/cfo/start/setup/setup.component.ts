import {Component, OnInit, Injector, OnDestroy} from '@angular/core';
import { InstanceServiceProxy, InstanceType } from 'shared/service-proxies/service-proxies';
import { CFOComponentBase } from '../../shared/common/cfo-component-base';

@Component({
    selector: 'setup',
    templateUrl: './setup.component.html',
    styleUrls: ['./setup.component.less'],
    providers: [InstanceServiceProxy]
})
export class SetupComponent extends CFOComponentBase implements OnInit, OnDestroy {
    isDisabled = false;
    private rootComponent: any;

    constructor(injector: Injector,
        private _instanceServiceProxy: InstanceServiceProxy
    ) {
        super(injector);
        this.rootComponent = this.getRootComponent();
    }

    ngOnInit(): void {
        super.ngOnInit();
        this.rootComponent.overflowHidden(true);
        this.rootComponent.addScriptLink('https://fast.wistia.com/embed/medias/kqjpmot28u.jsonp');
        this.rootComponent.addScriptLink('https://fast.wistia.com/assets/external/E-v1.js');
    }

    onStart(): void {
        this.isDisabled = true;
        this._instanceServiceProxy.setup(InstanceType[this.instanceType]).subscribe((data) => {
            this._cfoService.instanceChangeProcess();
            this._router.navigate(['/app/cfo/' + this.instanceType.toLowerCase() + '/linkaccounts']);
        });
    }

    ngOnDestroy() {
        this.rootComponent.removeScriptLink('https://fast.wistia.com/embed/medias/kqjpmot28u.jsonp');
        this.rootComponent.removeScriptLink('https://fast.wistia.com/assets/external/E-v1.js');
        this.rootComponent.overflowHidden();
    }
}
