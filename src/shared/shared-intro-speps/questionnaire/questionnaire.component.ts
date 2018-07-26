import {Component, OnInit, Injector, Input, Output, EventEmitter} from '@angular/core';

import { QuestionDto, AnswerDto, QuestionnaireResponseDto, QuestionnaireServiceProxy} from '@shared/service-proxies/service-proxies';
import { AppComponentBase } from 'shared/common/app-component-base';
import {finalize} from 'rxjs/operators';

@Component({
    selector: 'app-questionnaire',
    templateUrl: './questionnaire.component.html',
    styleUrls: ['./questionnaire.component.less'],
    providers: [QuestionnaireServiceProxy]
})
export class QuestionnaireComponent extends AppComponentBase implements OnInit {
    @Input() identifier: string;
    @Input() moduleName: string;
    question: QuestionDto;
    questionnaireId: number;
    @Output() closeDialog: EventEmitter<any> = new EventEmitter();

    constructor(
        injector: Injector,
        private _questionnaireService: QuestionnaireServiceProxy
    ) {
        super(injector);
    }

    ngOnInit() {
        this._questionnaireService.getInternal(this.moduleName, this.identifier)
            .subscribe(result => {
                this.questionnaireId = result.id;
                this.question = result.questions[0];
            });
    }

    submitQuestionnaire() {
        let response = new QuestionnaireResponseDto();
        response.questionnaireId = this.questionnaireId;
        response.answers = [];

        let selectedAnswerIds: number[] = [];
        this.question.options.forEach(v => {
            if (v['selected']) {
                selectedAnswerIds.push(v.id);
            }
        });

        if (selectedAnswerIds.length) {
            response.answers.push(new AnswerDto({
                questionId: this.question.id,
                options: selectedAnswerIds
            }));
            this._questionnaireService.submitResponseInternal(response)
                .pipe(finalize(() => this.finishLoading(true)))
                .subscribe((result) => {
                    this.closeDialog.emit(this);
                });
        } else {
            this.closeDialog.emit(this);
            this.finishLoading(true);
        }
    }
}
