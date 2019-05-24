import { Component, OnInit, Input } from '@angular/core';

@Component({
    selector: 'group-field',
    templateUrl: './group-field.component.html',
    styleUrls: ['./group-field.component.less']
})
export class GroupFieldComponent implements OnInit {
    @Input() label: string;
    constructor() { }

    ngOnInit() {
    }

}
