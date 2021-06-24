/** Core imports */
import { Component, EventEmitter, Output, Input, ViewChild } from '@angular/core';

/** Third party imports */
import { DxTooltipComponent } from 'devextreme-angular/ui/tooltip';
import { DxTextBoxComponent } from 'devextreme-angular/ui/text-box';

/** Application imports */
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';

@Component({
    selector: 'search-tooltip',
    templateUrl: './search-tooltip.component.html',
    styleUrls: ['./search-tooltip.component.less'],
    host: {
        '(document:keydown)': 'windowKeydown($event)',
        '(window:click)': 'windowClick($event)'
    }
})
export class SearchTooltipComponent {
    @Input() disabled = true;
    @Input() width = '300px';
    @Input() target = 'app-root';
    @Output() onSearch: EventEmitter<string> = new EventEmitter<string>();
    @Output() onDisplay: EventEmitter<boolean> = new EventEmitter<boolean>();
    @ViewChild(DxTooltipComponent, { static: false }) tooltip: DxTooltipComponent;
    @ViewChild(DxTextBoxComponent, { static: false }) textbox: DxTextBoxComponent;
    
    searchPhrase: string;

    public constructor(
        public ls: AppLocalizationService
    ) {}

    onShown() {
        this.onDisplay.emit(true);
        setTimeout(() =>
            this.textbox.instance.focus()
        );
    }

    onHiding() {
        this.searchPhrase = '';
        this.onDisplay.emit(false);
    }

    onValueChanged(event) {
        if (!this.disabled)
            this.onSearch.emit(event.value);
    }

    show() {
        if (this.tooltip && this.tooltip.instance)
            this.tooltip.instance.show(this.target);
    }

    hide() {
        this.onSearch.emit('');
        if (this.tooltip && this.tooltip.instance)
            this.tooltip.instance.hide();
    }

    windowKeydown(event) {
        if (this.disabled)
            return ;

        if (event.ctrlKey && event.keyCode == 70/*F*/) {
            this.show();
            event.stopPropagation();
            event.preventDefault();
        } else if (event.keyCode == 27/*Escape*/)
            this.hide();
    }

    windowClick(event) {
        let target = event.target;
        if (target) {
            let tooltip = this.tooltip.instance.element();
            while(target.tagName.toLowerCase() != 'body') {
                target = target.parentNode;
                if (!target || tooltip == target)
                    return ;
            }
            this.hide();
        }
    }
}