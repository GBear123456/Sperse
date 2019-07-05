/** Core imports */
import { Component, OnInit } from '@angular/core';

/** Third party imports */
import { Chart } from 'chart.js';
import * as $ from 'jquery';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';

@Component({
    selector: 'app-bank-code-wizzard',
    templateUrl: './bank-code-wizzard.component.html',
    styleUrls: ['./bank-code-wizzard.component.less']
})
export class BankCodeWizzardComponent implements OnInit {
    requestUrl = AppConsts.remoteServiceBaseUrl + '/api/services/CRM/External/GetBankCode?content=';
    textForAnalyse = '';
    chart: any;
    sortedResult = [];
    analyseResult = [
        { name: 'Blueprint', value: 0 },
        { name: 'Action', value: 1 },
        { name: 'Nurturing', value: 2 },
        { name: 'Knowledge', value: 3 }
    ];

    constructor(
    ) {
    }

    ngOnInit() {
        drawChart();
        console.log(AppConsts.remoteServiceBaseUrl);
    }

    categorizeText(text: string) {
        event.preventDefault();
        const requestUrl = this.requestUrl + text;
        const settings = {
            'async': true,
            'crossDomain': true,
            'url': requestUrl,
            // 'url': 'https://api.cyrano.ai/bankcode',
            'method': 'POST',
            'headers': {
                'x-api-key': 'Hug3PclOlz2XEFZHmWTb2a88A5hnFiGb32sR64ud',
                'Content-Type': 'application/json'
            },
            'processData': false,
            'data': JSON.stringify({ content: text.replace(/(\r\n|\n|\r)/gm, '') })
        };
        $.ajax(settings)
            .done(function (response) {
                this.anylizeResult = response.dimmensions;
                console.log(this.anylizeResult);
                this.sortedResult = sortingResult(this.anylizeResult, 'value');
                console.log(this.anylizeResult);
                let scores = [0, 0, 0, 0];
                for (let i = 0; i < response.dimmensions.length; i++) {
                    switch (response.dimmensions[i].name) {
                        case 'Blueprint':
                            scores[0] = response.dimmensions[i].value;
                            break;
                        case 'Action':
                            scores[1] = response.dimmensions[i].value;
                            break;
                        case 'Nurturing':
                            scores[2] = response.dimmensions[i].value;
                            break;
                        case 'Knowledge':
                            scores[3] = response.dimmensions[i].value;
                            break;
                        default:
                            break;
                    }
                }
                drawChart(scores);
                }
            )
            .fail(function (response) {
                console.log(response);
                $('#bankCodeAnalyzer').prop('readonly', false);
                $('#loader').prop('hidden', true);
            }
            );
    }

    onSubmit(event, formData) {
        event.preventDefault();
        const textForAnalyse = formData.value.textForAnalyse;
        this.categorizeText(textForAnalyse);
    }

}

function drawChart(scores = [0, 0, 0, 0]) {
    new Chart(document.getElementById('bankCodeChart'), {
        'type': 'bar',
        'data': {
            'labels': ['Blueprint', 'Action', 'Nurturing', 'Knowledge'],
            'datasets': [{
                'data': scores,
                'label': 'BANK Score',
                'fill': true,
                'backgroundColor': ['#004a81', '#b70000', '#faa000', '#176826']
            }]
        },
        'options': { 'scales': { 'yAxes': [{ 'ticks': { 'beginAtZero': true } }] } }
    });
}

function sortingResult(array, key) {
    return array.sort((a, b) => {
        console.log(a, b);
        console.log(a[key], b[key]);
        console.log(a[key] > b[key]);
        return a[key] - b[key];
    });
}
