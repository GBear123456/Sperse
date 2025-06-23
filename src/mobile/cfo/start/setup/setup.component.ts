import { Component, OnInit, Injector, OnDestroy } from '@angular/core';
import { InstanceServiceProxy, InstanceType } from 'shared/service-proxies/service-proxies';
import { CFOComponentBase } from '../../shared/common/cfo-component-base';
import { DomHelper } from '@shared/helpers/DomHelper';

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
        this.rootComponent.overflowHidden(true);
        DomHelper.addScriptLink('https://fast.wistia.com/embed/medias/kqjpmot28u.jsonp');
        DomHelper.addScriptLink('https://fast.wistia.com/assets/external/E-v1.js');
    }

    onStart(): void {
        this.isDisabled = true;
        this._instanceServiceProxy.setup(InstanceType[this.instanceType], undefined).subscribe(() => {
            this._cfoService.instanceChangeProcess();
            this._router.navigate(['/app/cfo/' + this.instanceType.toLowerCase() + '/linkaccounts']);
        });
    }

    ngOnDestroy() {
        DomHelper.removeScriptLink('https://fast.wistia.com/embed/medias/kqjpmot28u.jsonp');
        DomHelper.removeScriptLink('https://fast.wistia.com/assets/external/E-v1.js');
        this.rootComponent.overflowHidden();
    }
}
