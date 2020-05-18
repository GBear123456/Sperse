import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';

@Component({
    selector: 'process-board',
    templateUrl: 'process-board.component.html',
    styleUrls: ['process-board.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProcessBoardComponent {
    isOwnBankCodeCracked = false;
    isContactsBankCodeCracked = false;
    isBasicTrainingCompleted = false;
    steps = [
        {
            name: 'Create Your Account',
            completed: true
        },
        {
            name: 'Crack Your Own BANKCODE',
            completed: this.isOwnBankCodeCracked
        },
        {
            name: 'Crach A Contact\'s BANKCODE',
            completed: this.isContactsBankCodeCracked
        },
        {
            name: 'Complete The Basic Training',
            completed: this.isBasicTrainingCompleted
        },
        {
            name: 'TAKE IT TO THE BANK!®',
            completed: this.isBasicTrainingCompleted
        }
    ];
    constructor(public ls: AppLocalizationService) {}
}