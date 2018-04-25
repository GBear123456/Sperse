import { Component, Input, OnInit } from '@angular/core';

@Component({
    selector: 'info-component',
    templateUrl: 'info.component.html',
    styleUrls: ['info.component.less']
})
export class InfoComponent implements OnInit {
    @Input() imageSource: string;
    @Input() value: string;
    @Input() description: string;
    @Input() showFilteredSign = false;
    constructor() {}
    ngOnInit() {}
}
