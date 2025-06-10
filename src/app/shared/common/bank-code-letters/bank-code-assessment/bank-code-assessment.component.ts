import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, ChangeDetectorRef, OnInit } from '@angular/core';
import { BankCodeService } from '@app/shared/common/bank-code/bank-code.service';
import { BankCodeLetter } from '@app/shared/common/bank-code-letters/bank-code-letter.enum';
import { BANKCodeSelfAssessmentDto } from '@shared/service-proxies/service-proxies';

@Component({
    selector: 'bank-code-assessment',
    templateUrl: './bank-code-assessment.component.html',
    styleUrls: ['./bank-code-assessment.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class BankCodeAssessmentComponent implements OnInit {
    @Input() bankCode: string;
    @Input() assessmentResult: BANKCodeSelfAssessmentDto;

    letters: {
        letter: string,
        score: string,
        color: string
    }[] = []

    constructor(
        private bankCodeService: BankCodeService,
        private changeDetectorRef: ChangeDetectorRef
    ) {
    }

    ngOnInit(): void {
        this.setData()
    }

    setData() {
        this.letters = [];
        if (!this.bankCode || !this.assessmentResult)
            return;
        this.bankCode.toLowerCase().split('').forEach(v => {
            this.letters.push({
                letter: v,
                score: this.assessmentResult[v],
                color: this.getLetterColor(v)
            });
        });
        this.changeDetectorRef.markForCheck();
    }

    getLetterColor(letter: string): string {
        let style = this.bankCodeService.getColorsByLetter(BankCodeLetter[letter.toUpperCase()]);
        return style.background;
    }
}