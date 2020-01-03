/** Core imports */
import { Component } from '@angular/core';

/** Third party imports */
import { Chart } from 'chart.js';
import * as $ from 'jquery';
import * as moment from 'moment';

/** Application imports */

@Component({
    selector: 'app-bank-code-wizzard',
    templateUrl: './bank-code-wizzard.component.html',
    styleUrls: ['./bank-code-wizzard.component.less']
})
export class BankCodeWizzardComponent {
    requestUrl = 'https://testadmin.sperse.com/api/services/CRM/External/GetBankCode?content=';
    textForAnalyse = '';
    chart: any;
    scores;
    biggestValue = { name: 'Action', value: 1 };

    analyseResult = [
        { name: 'Blueprint', value: 0 },
        { name: 'Action', value: 1 },
        { name: 'Nurturing', value: 2 },
        { name: 'Knowledge', value: 3 }
    ];

    type = 'bar';
    data = {
        labels: ['Blueprint', 'Action', 'Nurturing', 'Knowledge'],
        datasets: [{
            'data': this.scores,
            'label': 'BANK Score',
            'fill': true,
            'backgroundColor': ['#004a81', '#b70000', '#faa000', '#176826']
        }]
    };
    options = {
        scales: { 'yAxes': [{ 'ticks': { 'beginAtZero': true } }] },
        responsive: true,
        maintainAspectRatio: false
    };
    currentYear: number = moment().year();

    categorizeText(text: string) {
        event.preventDefault();
        const requestUrl = this.requestUrl + text.replace(/(\r\n|\n|\r)/gm, '');
        const settings = {
            'async': true,
            'crossDomain': true,
            // 'url': 'https://api.cyrano.ai/bankcode',
            'url': requestUrl,
            'method': 'GET',
            'headers': {
                'x-api-key': 'Hug3PclOlz2XEFZHmWTb2a88A5hnFiGb32sR64ud',
                'Content-Type': 'application/json'
            },
            'processData': false
        };
        $.ajax(settings)
            .done(function (response) {
                let dimentions = response.result.dimmensions;
                this.analyseResult = dimentions;
                let scores = [0, 0, 0, 0];
                for (let i = 0; i < dimentions.length; i++) {
                    switch (dimentions[i].name) {
                        case 'Blueprint':
                            scores[0] = dimentions[i].value;
                            break;
                        case 'Action':
                            scores[1] = dimentions[i].value;
                            break;
                        case 'Nurturing':
                            scores[2] = dimentions[i].value;
                            break;
                        case 'Knowledge':
                            scores[3] = dimentions[i].value;
                            break;
                        default:
                            break;
                    }
                }
                this.scores = scores;
            })
            .fail(function (response) {
                console.log(response);
            });

        setTimeout(() => {
            if (this.analyseResult) this.biggestValue = this.analyseResult[this.analyseResult.length - 1];
        }, 200);
    }

    onSubmit(event, formData) {
        event.preventDefault();
        const textForAnalyse = formData.value.textForAnalyse;
        this.categorizeText(textForAnalyse);
    }

}

function sortingResult(array, key) {
    return array.sort((a, b) => {
        return a[key] - b[key];
    });
}
