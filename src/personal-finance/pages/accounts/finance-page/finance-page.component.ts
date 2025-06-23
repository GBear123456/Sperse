import { Component, Injector, Input, Output, EventEmitter } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';

@Component({
    selector: 'pfm-finance-page',
    templateUrl: './finance-page.component.html',
    styleUrls: ['./finance-page.component.less']
})
export class FinancePageComponent extends AppComponentBase {
    @Input() isStartDisabled: boolean;
    @Output('onButtonClicked') emitButtonClick: EventEmitter<any> = new EventEmitter();
    advantages = [
        {class: 'accounts', title: this.l('Adv_Title_1'), text: this.l('Adv_Text_1')},
        {class: 'budget', title: this.l('Adv_Title_2'), text: this.l('Adv_Text_2')},
        {class: 'fin-health', title: this.l('Adv_Title_3'), text: this.l('Adv_Text_3')},
    ];
    constructor(
        injector: Injector
    ) {
        super(injector);
    }

    onClick() {
        this.emitButtonClick.emit();
    }
}
