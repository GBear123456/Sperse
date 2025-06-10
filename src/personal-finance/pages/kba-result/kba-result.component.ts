/** Core imports */
import { Component, OnInit } from '@angular/core';
import { KbaInputModel } from './kba.model';

/** Third party imports */
import * as _ from 'underscore';

/** Application imports */
import { KBAServiceProxy } from 'shared/service-proxies/service-proxies';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';

@Component({
    selector: 'app-kba-result',
    templateUrl: './kba-result.component.html',
    providers: [KBAServiceProxy],
    styleUrls: ['./kba-result.component.less']
})
export class KbaResultComponent implements OnInit {
    model: KbaInputModel = new KbaInputModel();
    params: any = {};
    showingError: string;

    constructor(
        private KBAService: KBAServiceProxy,
        public ls: AppLocalizationService
    ) {
        this.parseParams();
        this.showingError = decodeURIComponent(this.params.err).replace(/[+]/g, ' ');
    }

    ngOnInit() {
        this.save();
        if (this.model.passed) {
            setTimeout(() => {
                window.parent.location.reload();
            }, 5000);
        }
    }

    parseParams() {
        this.params = _.object(
            _.compact(
                _.map(location.search.slice(1).split('&'),
                    function (item) {
                        if (item) {
                            return item.split('=');
                        }
                    }
                )
            )
        );
    }

    save(): void {
        this.model.memberId = this.params['MemberId'];
        this.model.err = this.params['err'];
        this.model.passed = (this.params['result'] == '1');
        this.KBAService.processKBAResponse(this.model)
            .subscribe(() => {});
    }
}
