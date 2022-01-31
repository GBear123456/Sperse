import {Component, OnInit, Input, Injector} from '@angular/core';
import {AppComponentBase} from '@shared/common/app-component-base';

@Component({
    selector: 'app-history-log',
    templateUrl: './history-log.component.html',
    styleUrls: ['./history-log.component.less']
})
export class HistoryLogComponent extends AppComponentBase implements OnInit {
    @Input() historyItems;

    constructor(injector: Injector) {
        super(injector);
    }

    ngOnInit() {}

}
