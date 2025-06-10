/** Core imports */
import { Component, ViewEncapsulation } from '@angular/core';

/** Third party imports */
import { LifecycleSubjectsService } from '@shared/common/lifecycle-subjects/lifecycle-subjects.service';

/** Application imports */
import { WhyTheyBuyComponent } from '@root/bank-code/products/why-they-buy/why-they-buy.component';

@Component({
    selector: 'why-they-buy-host',
    templateUrl: '../../bank-code/products/why-they-buy/why-they-buy.component.html',
    styleUrls: [
        '../../shared/common/styles/core.less',
        './why-they-buy-host.component.less',
//        '../../assets/metronic/dist/html/blue/assets/demo/blue/base/style.bundle.light.css',
        '../../../node_modules/devextreme/dist/css/dx.common.css',
        '../../../node_modules/devextreme/dist/css/dx.light.css',
        '../../bank-code/products/why-they-buy/why-they-buy.component.less'
    ],
    encapsulation: ViewEncapsulation.None,
    providers: [ LifecycleSubjectsService ]
})
export class WhyTheyBuyHostComponent extends WhyTheyBuyComponent {}
