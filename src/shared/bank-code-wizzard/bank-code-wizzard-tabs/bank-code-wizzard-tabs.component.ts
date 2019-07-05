/** Core imports */
import { Component, OnInit, Input } from '@angular/core';

/** Third party imports */

/** Application imports */

@Component({
    selector: 'app-bank-code-wizzard-tabs',
    templateUrl: './bank-code-wizzard-tabs.component.html',
    styleUrls: ['./bank-code-wizzard-tabs.component.less']
})
export class BankCodeWizzardTabsComponent implements OnInit {
    @Input() analyseResult;
    @Input() scores;

    constructor() {
    }

    ngOnInit() {}

}
