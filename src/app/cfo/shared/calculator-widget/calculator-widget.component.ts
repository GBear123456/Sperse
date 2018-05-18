import { Component, ElementRef, ViewChild, Injector, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CalculatorService } from './calculator-widget.service';
import { CFOComponentBase } from 'shared/cfo/cfo-component-base';

@Component({
    selector: 'calculator-widget',
    templateUrl: './calculator-widget.component.html',
    styleUrls: ['./calculator-widget.component.less']
})

export class CalculatorComponent extends CFOComponentBase implements OnChanges {
    private input: string = '';
    private historyEquation = '';
    lastOperation: string = '';
    private OpenedBrackets: number = 0;
    private ClosedBrackets: number = 0;

    calcHistory: CalcHistory[] = [];

    private readonly allowedChars: string[] = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '(', ')', '.', '%'];
    private readonly allowedOperators: string[] = ['+', '-', '*', '/'];

    isScientificMode: boolean = false;
    IsEditHistoryEnabled: boolean = false;
    @Input()
    parentEquation: string;

    @ViewChild('calculatorInput') calculatorInputControl: ElementRef;
    @ViewChild('calculatorHistoryEdit') calculatorHistoryEditControl: ElementRef;

    constructor(injector: Injector, private calculatorService: CalculatorService) {
        super(injector);
        this.isScientificMode = this.calculatorService.IsScientificModeEnabled;
        calculatorService.subscribePeriodChange((value) => {
            if (!value || (this.calcHistory.length && Number(this.calcHistory[this.calcHistory.length - 1].Result.replace(',', '')) !== value)) {
                this.ClearAll();
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
            console.log('parentEquation = ' + variableChange.currentValue);
            this.RegenerateEquation();
        }
    }

    // For outside consumers
    public GetExpression(): string {
        return this.calculatorService.GetExpression();
    }

    // For outside consumers
    public GetResult(): string {
        return this.calcHistory[this.calcHistory.length - 1].Result;
    }

    RegenerateEquation() {
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
            this.BackSpace();
        } else if (event.key === 'Escape') {
            this.ClearAll();
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
            this.ClearAll();
            this.input = num;
        } else if ((num === '(' && this.input.split('(').join('') !== '') // Opening brackets not allowed after numbers.
            || (num === ')' && this.input.indexOf('(') >= 0) // Closing bracket not allowed with (2
            || (this.input.endsWith(')') && num !== ')') // cannot open bracket after number, like 2( or )2
            || (num === ')' && this.OpenedBrackets <= 0)  // closing brackets more than opened are not allowed.
            || this.input.length === this.calculatorService.TotalDigitsAllowed
            || this.input.endsWith('%')
            || (num === '%' && this.input.split('(').join('').split(')').join('') === '')
            || (this.lastOperation === '/' && this.input === '' && parseFloat(num) === 0)
            || (!this.calculatorService.IsScientificModeEnabled && (num === '(' || num === ')'))
            || (this.input.indexOf('.') >= 0 && num === '.')
        ) {
            return;
        } else {
            if (num === '(') {
                this.OpenedBrackets++;
                // this.calculatorService.HigherPrecedenceLevel++;
            } else if (num === ')' && this.OpenedBrackets > 0) {
                this.OpenedBrackets--;
                this.ClosedBrackets++;
            }
            this.input += num;
        }
    }

    selectOperator(operation: string) {
        this.calculatorInputControl.nativeElement.focus();

        // if (this.calcHistory.length >= 10) {
        //     this.ShowTotal();
        //     return;
        // }

        if (operation === '=' && this.IsEditHistoryEnabled) {
            this.IsEditHistoryEnabled = false;
            this.RegenerateEquation();
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
        //     // this.input = this.calculatorService.RoundUpNumber((parseFloat(this.calcHistory[this.calcHistory.length - 1].Result)
        //     //                * (percentNumber / 100))).toString();
        //     this.input = this.calculatorService.RoundUpNumber(percentNumber / 100).toString();
        // }
        this.calculatorService.AddToCalculator(this.lastOperation, this.input);

        let inputNum: string = this.input.split('(').join('').split(')').join('').split('-').join('').split('%').join('');
        inputNum = this.input.replace(inputNum, this.calculatorService.GetNumberWithCommas(parseFloat(inputNum).toString()));  // To add 0 to ".2" and remove . in "2."

        this.AddToHistory(this.lastOperation, inputNum, this.calculatorService.GetExpressionValue());

        this.lastOperation = operation;

        console.log('Input: ' + this.input + ' ; Operator: ' + operation);
        this.DisplayTreeContent();

        if (operation === '=') {
            this.ShowTotal();
        } else {
            this.input = '';
        }
    }

    private DisplayTreeContent(): void {
        let log: string = this.calculatorService.DisplayTreeContent();
        console.log(log);
        console.log('Expression Value: ' + this.calculatorService.GetExpressionValue());
    }

    private ClearAll(): void {
        this.calculatorInputControl.nativeElement.focus();
        this.lastOperation = '';
        this.input = '';
        this.calcHistory = [];
        this.OpenedBrackets = 0;
        this.ClosedBrackets = 0;
        this.calculatorService.ClearAll();
        this.DisplayTreeContent();  // Just to make sure the Tree is empty.
    }

    BackSpace(): void {
        this.calculatorInputControl.nativeElement.focus();
        if (this.lastOperation === '=') {
            this.ClearAll();
        } else {
            if (this.input.endsWith('(')) {
                this.OpenedBrackets--;
            } else if (this.input.endsWith(')')) {
                this.OpenedBrackets++;
                this.ClosedBrackets--;
            }
            this.input = this.input.substr(0, this.input.length - 1);
        }
    }

    private AddToHistory(operatorParam: string, operandParam: string, resultParam: string) {
        let history: CalcHistory = {
            Operator: operatorParam,
            Operand: operandParam,
            Result: resultParam
        };
        this.calcHistory.push(history);
    }

    private ShowTotal() {
        this.input = '$' + this.calcHistory[this.calcHistory.length - 1].Result;
        let numberResult = Number(this.calcHistory[this.calcHistory.length - 1].Result.replace(',', ''));
        this.calculatorService.valueChanged(numberResult);
    }

    ToggleScienticMode() {
        this.ClearAll();
        this.isScientificMode = this.calculatorService.IsScientificModeEnabled = !this.calculatorService.IsScientificModeEnabled;
        // console.log('this.calculatorService.IsScientificModeEnabled = ' + this.calculatorService.IsScientificModeEnabled);
    }

    ToggleEditHistory() {
        this.IsEditHistoryEnabled = !this.IsEditHistoryEnabled;
        if (this.IsEditHistoryEnabled) {
            this.calculatorHistoryEditControl.nativeElement.focus();
            if (this.isScientificMode) {
                this.historyEquation = this.GetExpression();
            } else {
                this.historyEquation = '';
                for (let i = 0; i < this.calcHistory.length; i++) {
                    this.historyEquation += this.calcHistory[i].Operator + this.calcHistory[i].Operand; // No operator for first operand.
                }
            }
            this.calculatorHistoryEditControl.nativeElement.value = this.historyEquation;
            this.ClearAll();
            console.log('this.historyEquation = ' + this.historyEquation);
        }
    }
}

class CalcHistory {
    Operator: string = '';
    Operand: string = '';
    Result: string = '';
}

