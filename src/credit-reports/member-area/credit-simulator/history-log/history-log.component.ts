import {Component, OnInit, Input, Injector} from '@angular/core';
import {AppComponentBase} from '@shared/common/app-component-base';
import {appModuleAnimation} from '@shared/animations/routerTransition';

@Component({
    selector: 'app-history-log',
    templateUrl: './history-log.component.html',
    styleUrls: ['./history-log.component.less'],
    animations: [appModuleAnimation()]
})
export class HistoryLogComponent extends AppComponentBase implements OnInit {
    @Input() historyItems;

    constructor(injector: Injector) {
        super(injector);
    }

    ngOnInit() {}

}
