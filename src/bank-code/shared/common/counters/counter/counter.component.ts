import { Component, Input } from '@angular/core';
import range from 'lodash/range';
import { CrackedCode } from '../cracked-code.interface';
import {AppLocalizationService} from "@app/shared/common/localization/app-localization.service";

@Component({
    selector: 'counter',
    templateUrl: 'counter.component.html',
    styleUrls: ['counter.component.less']
})
export class CounterComponent {
    @Input() title: string;
    @Input() total: string;
    @Input() totalByLetter: CrackedCode[];
    range = range;
    constructor(public ls: AppLocalizationService) {}

    showComma(total: string, i: number): boolean {
        const numberReverseIndex = total.length - i;
        return i !== 0 && numberReverseIndex !== total.length && numberReverseIndex % 3 === 0;
    }
}