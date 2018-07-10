import { Component, ElementRef, ViewChild, Injector, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CalculatorService } from './calculator-widget.service';
import { CFOComponentBase } from 'shared/cfo/cfo-component-base';

@Component({
    selector: 'calculator-widget',
    templateUrl: './calculator-widget.component.html',
    styleUrls: ['./calculator-widget.component.less']
})

export class CalculatorComponent extends CFOComponentBase implements OnChanges {
    input = '';
    historyEquation = '';
    lastOperation = '';
    openedBrackets = 0;
    closedBrackets = 0;

    calcHistory: CalcHistory[] = [];

    readonly allowedChars: string[] = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '(', ')', '.', '%'];
    readonly allowedOperators: string[] = ['+', '-', '*', '/'];

    isScientificMode = false;
    isEditHistoryEnabled = false;
    @Input()
    parentEquation: string;

    @ViewChild('calculatorInput') calculatorInputControl: ElementRef;
    @ViewChild('calculatorHistoryEdit') calculatorHistoryEditControl: ElementRef;

    constructor(injector: Injector, public calculatorService: CalculatorService) {
        super(injector);
        this.isScientificMode = this.calculatorService.isScientificModeEnabled;
        calculatorService.subscribePeriodChange((value) => {
            if (!value || (this.calcHistory.length && Number(this.calcHistory[this.calcHistory.length - 1].result.replace(',', '')) !== value)) {
                this.clearAll();
            }
            if (value) {
                let newVal = value.toString();
                if (this.input !== newVal) {
                    this.input = newVal;
                }
            }
        });
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['parentEquation']) {
            let variableChange = changes['parentEquation'];
            this.historyEquation = variableChange.currentValue;
            this.regenerateEquation();
        }
    }

    // For outside consumers
    public getExpression(): string {
        return this.calculatorService.getExpression();
    }

    // For outside consumers
    public getResult(): string {
        return this.calcHistory[this.calcHistory.length - 1].result;
    }

    regenerateEquation() {
        this.historyEquation = this.calculatorHistoryEditControl.nativeElement.value;
        if (this.historyEquation !== '') {
            for (let i = 0; i < this.historyEquation.length; i++) {
                if (this.allowedOperators.indexOf(this.historyEquation.charAt(i)) >= 0
                    || this.historyEquation.charAt(i).toLowerCase() === 'x') {
                    this.selectOperator(this.historyEquation.charAt(i));
                } else {
                    this.inputNumber(this.historyEquation.charAt(i));
                }
            }
            this.selectOperator('=');
        }
    }

    inputKeyPress(event: any): boolean {
        if (this.allowedChars.indexOf(event.key) >= 0) {
            this.inputNumber(event.key);
        } else if (this.allowedOperators.indexOf(event.key) >= 0) {
            this.selectOperator(event.key);
        } else if (event.key === 'Enter') {
            this.selectOperator('=');
        } else if (event.key === 'Backspace') {
            this.backSpace();
        } else if (event.key === 'Escape') {
            this.clearAll();
        } else {
            console.log(event.key);
        }
        return false;
    }

    inputNumber(num: string): void {
        this.calculatorInputControl.nativeElement.focus();

        // if (this.calcHistory.length >= 10) {
        //     return;
        // }

        if (this.lastOperation === '=') {
            this.clearAll();
            this.input = num;
        } else if ((num === '(' && this.input.split('(').join('') !== '') // Opening brackets not allowed after numbers.
            || (num === ')' && this.input.indexOf('(') >= 0) // Closing bracket not allowed with (2
            || (this.input.endsWith(')') && num !== ')') // cannot open bracket after number, like 2( or )2
            || (num === ')' && this.openedBrackets <= 0)  // closing brackets more than opened are not allowed.
            || this.input.length === this.calculatorService.totalDigitsAllowed
            || this.input.endsWith('%')
            || (num === '%' && this.input.split('(').join('').split(')').join('') === '')
            || (this.lastOperation === '/' && this.input === '' && parseFloat(num) === 0)
            || (!this.calculatorService.isScientificModeEnabled && (num === '(' || num === ')'))
            || (this.input.indexOf('.') >= 0 && num === '.')
        ) {
            return;
        } else {
            if (num === '(') {
                this.openedBrackets++;
                // this.calculatorService.HigherPrecedenceLevel++;
            } else if (num === ')' && this.openedBrackets > 0) {
                this.openedBrackets--;
                this.closedBrackets++;
            }
            this.input += num;
        }
    }

    selectOperator(operation: string) {
        this.calculatorInputControl.nativeElement.focus();

        // if (this.calcHistory.length >= 10) {
        //     this.showTotal();
        //     return;
        // }

        if (operation === '=' && this.isEditHistoryEnabled) {
            this.isEditHistoryEnabled = false;
            this.regenerateEquation();
            return;
        }
        if (operation === '*') {
            operation = 'x';
        }

        if (this.input === '') {
            this.lastOperation = operation;
            return;
        }

        if (this.lastOperation === '=') {
            if (operation !== '=') {
                this.input = '';
                this.lastOperation = operation;
            }
            return;
        }

        // if (this.input.endsWith('%')) {
        //     let percentNumber: number = parseFloat(this.input.substr(0, this.input.length - 1));
        //     // this.input = this.calculatorService.RoundUpNumber((parseFloat(this.calcHistory[this.calcHistory.length - 1].result)
        //     //                * (percentNumber / 100))).toString();
        //     this.input = this.calculatorService.RoundUpNumber(percentNumber / 100).toString();
        // }
        this.calculatorService.addToCalculator(this.lastOperation, this.input);

        let inputNum: string = this.input.split('(').join('').split(')').join('').split('-').join('').split('%').join('');
        inputNum = this.input.replace(inputNum, this.calculatorService.getNumberWithCommas(parseFloat(inputNum).toString()));  // To add 0 to ".2" and remove . in "2."

        this.addToHistory(this.lastOperation, inputNum, this.calculatorService.getExpressionValue());

        this.lastOperation = operation;
        this.displayTreeContent();

        if (operation === '=') {
            this.showTotal();
        } else {
            this.input = '';
        }
    }

    displayTreeContent(): void {
        let log: string = this.calculatorService.displayTreeContent();
    }

    clearAll(): void {
        this.calculatorInputControl.nativeElement.focus();
        this.lastOperation = '';
        this.input = '';
        this.calcHistory = [];
        this.openedBrackets = 0;
        this.closedBrackets = 0;
        this.calculatorService.clearAll();
        this.displayTreeContent();  // Just to make sure the Tree is empty.
    }

    backSpace(): void {
        this.calculatorInputControl.nativeElement.focus();
        if (this.lastOperation === '=') {
            this.clearAll();
        } else {
            if (this.input.endsWith('(')) {
                this.openedBrackets--;
            } else if (this.input.endsWith(')')) {
                this.openedBrackets++;
                this.closedBrackets--;
            }
            this.input = this.input.substr(0, this.input.length - 1);
        }
    }

    addToHistory(operatorParam: string, operandParam: string, resultParam: string) {
        let history: CalcHistory = {
            operator: operatorParam,
            operand: operandParam,
            result: resultParam
        };
        this.calcHistory.push(history);
    }

    showTotal() {
        this.input = '$' + this.calcHistory[this.calcHistory.length - 1].result;
        let numberResult = Number(this.calcHistory[this.calcHistory.length - 1].result.replace(',', ''));
        this.calculatorService.valueChanged(numberResult);
    }

    toggleScienticMode() {
        this.clearAll();
        this.isScientificMode = this.calculatorService.isScientificModeEnabled = !this.calculatorService.isScientificModeEnabled;
        // console.log('this.calculatorService.IsScientificModeEnabled = ' + this.calculatorService.IsScientificModeEnabled);
    }

    toggleEditHistory() {
        this.isEditHistoryEnabled = !this.isEditHistoryEnabled;
        if (this.isEditHistoryEnabled) {
            this.calculatorHistoryEditControl.nativeElement.focus();
            if (this.isScientificMode) {
                this.historyEquation = this.getExpression();
            } else {
                this.historyEquation = '';
                for (let i = 0; i < this.calcHistory.length; i++) {
                    this.historyEquation += this.calcHistory[i].operator + this.calcHistory[i].operand; // No operator for first operand.
                }
            }
            this.calculatorHistoryEditControl.nativeElement.value = this.historyEquation;
            this.clearAll();
        }
    }
}

class CalcHistory {
    operator = '';
    operand = '';
    result = '';
}

