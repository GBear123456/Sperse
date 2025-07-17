/** Core imports */
import { ChangeDetectionStrategy, Component, ChangeDetectorRef, Input } from '@angular/core';

/** Third party imports */
import { ClipboardService } from 'ngx-clipboard';
import { NotifyService } from 'abp-ng2-module';
import { v4 as UUID } from 'uuid';

/** Application imports */
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';

@Component({
    selector: 'converted-currency-tooltip',
    templateUrl: './converted-currency-tooltip.component.html',
    styleUrls: ['./converted-currency-tooltip.component.less'],
    providers: [],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConvertedCurrencyTooltipComponent {
    @Input() show: boolean = false;
    @Input() currency: string;
    @Input() data: { [key: string]: number; };

    targetId = 'target-' + UUID();

    public Object = Object;

    constructor(
        private clipboardService: ClipboardService,
        private notify: NotifyService,
        private ls: AppLocalizationService
    ) {}

    detailsAvailable(): boolean {
        return this.data && Object.keys(this.data).filter(v => v != this.currency).length > 0;
    }

    copyToClipboard(text) {
        this.clipboardService.copyFromContent(text);
        this.notify.info(this.ls.l('SavedToClipboard'));
    }
}