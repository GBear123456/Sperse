import {Component, OnInit, Injector, Input } from '@angular/core';
import {AppComponentBase} from 'shared/common/app-component-base';

@Component({
    selector: 'app-no-data',
    templateUrl: './no-data.component.html',
    styleUrls: ['./no-data.component.less']
})
export class NoDataComponent extends AppComponentBase implements OnInit {
    @Input('imageSource') imageSource = './assets/common/icons/no-data-icon.png';
    @Input('title') title: string = this.ls('Platform', 'No_Available_Data');
    @Input('text') text = '';
    @Input('showLink') showLink: boolean;
    @Input('linkText') linkText: string;
    @Input('linkUrl') linkUrl: string;

    constructor(injector: Injector) {
        super(injector);
    }

    ngOnInit() { }

}
