import { Injectable, Injector } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';
import { Subject } from 'rxjs/Subject';

@Injectable()
export class CalculatorService {
    readonly bracketsPrecedenceLevelStart: number = 1;
    readonly totalDigitsAllowed: number = 15;   // including decimal point
    private rootNode: ExpressionNode;
    private bracketsPrecedenceLevel: number;
    private standardCalculatordata: StandardModedata = {
        result: 0,
        operand: 0,
        operator: ''
    };

    public treeContentLog: string;
    public isScientificModeEnabled: boolean;

    constructor(injector: Injector) {
        this.bracketsPrecedenceLevel = this.bracketsPrecedenceLevelStart;
        this.isScientificModeEnabled = false;
        this._value = new Subject<Object>();
    }

    // #region "Public Functions"

    public addToCalculator(operator: string, operand: string) {
        if (this.isScientificModeEnabled) {
            return this.addToTree(operator, operand);
        } else {
            return this.addToStandardMode(operator, operand);
        }
    }

    public getExpressionValue(): string {
        if (this.isScientificModeEnabled) {
            return this.getTreeExpressionValue();
        } else {
            return this.getStandardCalculationValue();
        }
    }

    public displayTreeContent(): string {
        if (this.rootNode != null) {
            this.treeContentLog = 'Root: ' + this.rootNode.data + '\n';
            this.inOrderTraversal(this.rootNode);
            this.treeContentLog += '\n';
            this.preOrderTraversal(this.rootNode);
            this.treeContentLog += '\n';
            this.postOrderTraversal(this.rootNode);
        } else {
            this.treeContentLog = 'Expression is empty!';
        }
        return this.treeContentLog;
    }

    public inOrderTraversal(node: ExpressionNode): void {
        if (node != null) {
            this.inOrderTraversal(node.left);
            this.treeContentLog += node.openingBrackets + node.data + node.closingBrackets;
            this.inOrderTraversal(node.right);
        }
    }

    public preOrderTraversal(node: ExpressionNode): void {
        if (node != null) {
            this.treeContentLog += node.data;
            this.preOrderTraversal(node.left);
            this.preOrderTraversal(node.right);
        }
    }

    public postOrderTraversal(node: ExpressionNode): void {
        if (node != null) {
            this.postOrderTraversal(node.left);
            this.postOrderTraversal(node.right);
            this.treeContentLog += node.data;
        }
    }

    public getExpression(): string {
        this.treeContentLog = '';
        this.inOrderTraversal(this.rootNode);
        return this.treeContentLog;
    }

    public clearAll(): void {
        this.rootNode = null;
        this.treeContentLog = '';
        this.bracketsPrecedenceLevel = this.bracketsPrecedenceLevelStart;
    }

    public roundUpForDisplay(num: number, isFixed = true): string {
        if (isFixed) {
            return this.getNumberWithCommas(num.toFixed(2));  //.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
        }
        return this.getNumberWithCommas(num.toString());   //.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
    }

    public getNumberWithCommas(num: string): string {
        let parts = num.toString().split('.');
        parts[0] = parts[0].replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
        return parts.join('.');
    }

    // #endregion

    // #region "Private Functions"

    // #region "Standard Mode Calculator"

    private addToStandardMode(operator: string, operand: string) {
        if (operand.endsWith('%')) {
            operand = (parseFloat(operand.substr(0, operand.length - 1)) / 100).toString();
        }
        if (operator === '') {
            this.standardCalculatordata.result = parseFloat(operand);
        } else {
            this.standardCalculatordata.operand = parseFloat(operand);
            this.standardCalculatordata.operator = operator;
            this.standardCalculatordata.result = this.evaluateExpression(this.standardCalculatordata.result
                , operator, this.standardCalculatordata.operand);
        }
    }

    private getStandardCalculationValue(): string {
        let result: number = this.roundUpNumber(this.standardCalculatordata.result);
        return this.formatNumber(result);
    }
    // #endregion

    // #region Scientific Mode Calculator

    private addToTree(operator: string, operand: string) {
        if (operand == null || this.isScientificModeEnabled === false) {
            return;
        }

        let operatorNode: ExpressionNode = operator == null || operator === '' ? null : this.createNewNode(operator);
        let operandNode: ExpressionNode = this.createNewNode(operand);

        if (operatorNode != null && this.bracketsPrecedenceLevel > this.bracketsPrecedenceLevelStart) {
            operatorNode.precedenceOverrideLevel = this.bracketsPrecedenceLevel;
        }
        // The below Increment/Decrement will affect the precedence of next operator.
        if (operandNode.openingBrackets !== '') {
            this.bracketsPrecedenceLevel++;
        } else if (operandNode.closingBrackets !== '') {
            this.bracketsPrecedenceLevel--;
        }

        let explicitPrecedence = operatorNode == null ? 0 : operatorNode.precedenceOverrideLevel;
        this.rootNode = this.createExpressionTree(this.rootNode, operatorNode, operandNode,
            explicitPrecedence);
    }

    private createExpressionTree(rootNode: ExpressionNode, operatorNode: ExpressionNode,
        operandNode: ExpressionNode, explicitPrecedence: number): ExpressionNode {
        if (rootNode != null && operatorNode != null) {
            let rootPrecedence: number = this.getPrecedence(rootNode.data) + rootNode.precedenceOverrideLevel;
            let operatorPrecedence: number = this.getPrecedence(operatorNode.data) + operatorNode.precedenceOverrideLevel;

            if (rootPrecedence !== 0 && (rootPrecedence < operatorPrecedence || explicitPrecedence > this.bracketsPrecedenceLevelStart)) {
                if (explicitPrecedence > this.bracketsPrecedenceLevelStart) {
                    explicitPrecedence--;
                }
                rootNode.right = this.createExpressionTree(rootNode.right, operatorNode, operandNode, explicitPrecedence);
                return rootNode;
            }

            operatorNode.left = rootNode;
            operatorNode.right = operandNode;
            return operatorNode;
        } else {
            return operandNode;
        }
    }

    private createNewNode(data: string): ExpressionNode {
        let node: ExpressionNode = {
            openingBrackets: data.lastIndexOf('(') >= 0 ? data.substr(0, data.lastIndexOf('(') + 1) : '',
            data: data.split('(').join('').split(')').join(''),
            closingBrackets: data.indexOf(')') >= 0 ? data.substr(data.indexOf(')'), data.length - data.indexOf(')')) : '',
            left: null,
            right: null,
            precedenceOverrideLevel: 0,
        };
        return node;
    }

    private getTreeExpressionValue(): string {
        let result: number = this.roundUpNumber(this.evaluateTree(this.rootNode));
        return this.formatNumber(result);
    }

    private evaluateTree(rootNode: ExpressionNode): number {
        if (rootNode == null) {
            return 0;
        }

        if (rootNode.left == null && rootNode.right == null) {
            if (rootNode.data.endsWith('%')) {
                return (parseFloat(rootNode.data.substr(0, rootNode.data.length - 1)) / 100);
            }
            return parseFloat(rootNode.data);
        }

        let leftValue: number = this.evaluateTree(rootNode.left);
        let rightValue: number = this.evaluateTree(rootNode.right);

        return this.evaluateExpression(leftValue, rootNode.data, rightValue);
    }
    // #endregion

    // #region Common Functions

    private getPrecedence(operator: string): number {
        switch (operator) {
            case '+':
            case '-':
                return 1;
            case 'x':
            case '/':
                return 2;
            case '%':
                return 3;
            default:
                return 0;
        }
    }

    private evaluateExpression(leftValue: number, operator: string, rightValue: number): number {
        switch (operator) {
            case '+':
                return leftValue + rightValue;
            case '-':
                return leftValue - rightValue;
            case 'x':
                return leftValue * rightValue;
            case '/':
                let res = leftValue / rightValue;
                return res === Infinity ? 0 : res;
            case '%':
                return 0;
            default:
                return 0;
        }
    }

    private formatNumber(result: number): string {
        if ((result.toString().indexOf('.') < 0 && result.toString().length > this.totalDigitsAllowed)
            ||
            (result.toString().indexOf('.') >= 0 && result.toString().length > (this.totalDigitsAllowed + 3))
        ) {
            return result.toExponential(3);
        } else {
            return this.roundUpForDisplay(result);
        }
    }

    private roundUpNumber(num: number): number {
        return Math.round(num * 100) / 100;
        // return (Math.round(num * 100) / 100).toFixed(2);
    }
    // #endregion
    // #endregion "Private Functions"


    private _value: Subject<Object>;
    private _subscribers: Array<Subscription> = [];

    subscribePeriodChange(callback: (value: Object) => any) {
        this._subscribers.push(
            this._value.asObservable().subscribe(callback)
        );
    }

    valueChanged(value) {
        this._value.next(value);
    }

    unsubscribe() {
        this._subscribers.map((sub) => {
            return void (sub.unsubscribe());
        });
        this._subscribers.length = 0;
    }
}

interface ExpressionNode {
    openingBrackets: string;
    left: ExpressionNode;
    data: string;
    precedenceOverrideLevel: number;
    right: ExpressionNode;
    closingBrackets: string;
}

interface StandardModedata {
    operand: number;
    operator: string;
    result: number;
}
