import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Observable } from 'rxjs';
import { skip } from 'rxjs/operators';
import { BankCodeService } from '@app/shared/common/bank-code/bank-code.service';

@Component({
    selector: 'glance',
    templateUrl: 'glance.component.html',
    styleUrls: [
        '../styles/card-header.less',
        '../styles/card-body.less',
        'glance.component.less'
    ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class GlanceComponent {
    bankCodeLevel$: Observable<number> = this.bankCodeService.bankCodeLevel$.pipe(skip(1));
    bankCodeGroupsCounts$: Observable<number[]> = this.bankCodeService.contactBankCodeGroupsCounts$;
    bankCodeClientsCount$: Observable<number> = this.bankCodeService.contactBankCodeClientsCount$;

    constructor(private bankCodeService: BankCodeService) {}
}
