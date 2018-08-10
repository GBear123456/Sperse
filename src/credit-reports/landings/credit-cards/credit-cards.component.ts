import { Component, Injector, OnInit} from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';

@Component({
    selector: 'app-root',
    templateUrl: 'credit-cards.component.html',
    styleUrls: ['credit-cards.component.less']
})

export class CreditCardsComponent extends AppComponentBase implements OnInit {
    constructor(
      injector: Injector
    ) {
      super(injector);
    }

    ngOnInit() {
    }
}
