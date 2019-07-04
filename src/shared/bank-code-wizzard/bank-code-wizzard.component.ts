import { Component, OnInit } from '@angular/core';

@Component({
    selector: 'app-bank-code-wizzard',
    templateUrl: './bank-code-wizzard.component.html',
    styleUrls: ['./bank-code-wizzard.component.less']
})
export class BankCodeWizzardComponent implements OnInit {
    codeResult = [
        'A', 'N', 'B', 'K'
    ];

    constructor() {
    }

    ngOnInit() {
    }

}
