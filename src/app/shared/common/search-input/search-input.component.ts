import { Component, EventEmitter, Input, Output } from '@angular/core';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';

@Component({
    selector: 'search-input',
    templateUrl: './search-input.component.html',
    styleUrls: ['./search-input.component.less']
})
export class SearchInputComponent {
    @Input() value = '';
    @Input() width = 279;
    @Input() placeholder = this.ls.l('Find');
    @Output() onInput: EventEmitter<string> = new EventEmitter();
    constructor(public ls: AppLocalizationService) {}

    searchChanged(e) {
        this.onInput.emit(e.event.target.value);
    }

}
