import { Component, Injector, Inject, OnInit, ViewChild } from '@angular/core';
import { CFOComponentBase } from '@shared/cfo/cfo-component-base';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { FormGroup } from '@angular/forms';
import { MatHorizontalStepper, MAT_DIALOG_DATA } from '@angular/material';
import { QuestionnaireServiceProxy, QuestionDto, QuestionnaireResponseDto, AnswerDto } from 'shared/service-proxies/service-proxies';

@Component({
    selector: 'app-cfo-intro',
    templateUrl: './cfo-intro.component.html',
    styleUrls: ['./cfo-intro.component.less'],
    animations: [appModuleAnimation()],
    providers: [QuestionnaireServiceProxy]
})
export class CfoIntroComponent extends CFOComponentBase implements OnInit {
    @ViewChild('stepper') stepper: MatHorizontalStepper;
    isLinear = false;
    videoIndex = 6;
    readonly identifier = 'CFO-Instance-Setup';

    question: QuestionDto;

    constructor(
        injector: Injector,
        @Inject(MAT_DIALOG_DATA) public data: any,
        private _questionnaireService: QuestionnaireServiceProxy
    ) {
        super(injector);
    }

    ngOnInit() {
        this._questionnaireService.getQuestionnaire(this.identifier)
            .subscribe(result => {
                this.question = result.questions[0];
            });
    }

    onSubmit() {
        let response = new QuestionnaireResponseDto();
        response.identifier = this.identifier;
        response.answers = [];

        let selectedAnswerIds: number[] = [];
        this.question.options.forEach(v => {
            if (v['selected']) {
                selectedAnswerIds.push(v.id);
            }
        });
        response.answers.push(new AnswerDto({
            questionId: this.question.id,
            choosedOptions: selectedAnswerIds
        }));

        this._questionnaireService.submitQuestionnaireResponse(response)
            .subscribe((result) => { });
    }

    showVideo() {
        this.stepper.selectedIndex = this.videoIndex;
    }
}
