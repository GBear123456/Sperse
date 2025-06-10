import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { QuestionDto, AnswerDto, QuestionnaireResponseDto, QuestionnaireServiceProxy } from '@shared/service-proxies/service-proxies';
import { finalize } from 'rxjs/operators';
import { LoadingService } from '@shared/common/loading-service/loading.service';

@Component({
    selector: 'app-questionnaire',
    templateUrl: './questionnaire.component.html',
    styleUrls: ['./questionnaire.component.less'],
    providers: [ QuestionnaireServiceProxy ]
})
export class QuestionnaireComponent implements OnInit {
    @Input() identifier: string;
    @Input() moduleName: string;
    question: QuestionDto;
    questionnaireId: number;
    @Output() closeDialog: EventEmitter<any> = new EventEmitter();

    constructor(
        private questionnaireService: QuestionnaireServiceProxy,
        private loadingService: LoadingService,
    ) {}

    ngOnInit() {
        this.questionnaireService.getInternal(this.moduleName, this.identifier)
            .subscribe(result => {
                this.questionnaireId = result.id;
                this.question = result.questions[0];
            });
    }

    submitQuestionnaire(element: HTMLElement) {
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
            this.questionnaireService.submitResponseInternal(response)
                .pipe(finalize(() => this.loadingService.finishLoading(element)))
                .subscribe(() => {
                    this.closeDialog.emit(this);
                });
        } else {
            this.closeDialog.emit(this);
            this.loadingService.finishLoading(element);
        }
    }

    onSelectionChange($event) {
        $event.target.parentElement.classList.toggle('selected');
    }
}
