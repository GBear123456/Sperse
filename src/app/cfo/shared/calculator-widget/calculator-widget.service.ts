import { Injectable, Injector } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';
import { Subject } from 'rxjs/Subject';

@Injectable()
export class CalculatorService {
    readonly BracketsPrecedenceLevelStart: number = 1;
    readonly TotalDigitsAllowed: number = 15;   // including decimal point
    private RootNode: ExpressionNode;
    private BracketsPrecedenceLevel: number;
    private StandardCalculatorData: StandardModeData = {
        Result: 0,
        Operand: 0,
        Operator: ''
    };

    public TreeContentLog: string;
    public IsScientificModeEnabled: boolean;

    constructor(injector: Injector) {
        this.BracketsPrecedenceLevel = this.BracketsPrecedenceLevelStart;
        this.IsScientificModeEnabled = false;
        this._value = new Subject<Object>();
    }

    // #region "Public Functions"

    public AddToCalculator(operator: string, operand: string) {
        if (this.IsScientificModeEnabled) {
            return this.AddToTree(operator, operand);
        } else {
            return this.AddToStandardMode(operator, operand);
        }
    }

    public GetExpressionValue(): string {
        if (this.IsScientificModeEnabled) {
            return this.GetTreeExpressionValue();
        } else {
            return this.GetStandardCalculationValue();
        }
    }

    public DisplayTreeContent(): string {
        if (this.RootNode != null) {
            this.TreeContentLog = 'Root: ' + this.RootNode.Data + '\n';
            this.InOrderTraversal(this.RootNode);
            this.TreeContentLog += '\n';
            this.PreOrderTraversal(this.RootNode);
            this.TreeContentLog += '\n';
            this.PostOrderTraversal(this.RootNode);
        } else {
            this.TreeContentLog = 'Expression is empty!';
        }
        return this.TreeContentLog;
    }

    public InOrderTraversal(node: ExpressionNode): void {
        if (node != null) {
            this.InOrderTraversal(node.Left);
            this.TreeContentLog += node.OpeningBrackets + node.Data + node.ClosingBrackets;
            this.InOrderTraversal(node.Right);
        }
    }

    public PreOrderTraversal(node: ExpressionNode): void {
        if (node != null) {
            this.TreeContentLog += node.Data;
            this.PreOrderTraversal(node.Left);
            this.PreOrderTraversal(node.Right);
        }
    }

    public PostOrderTraversal(node: ExpressionNode): void {
        if (node != null) {
            this.PostOrderTraversal(node.Left);
            this.PostOrderTraversal(node.Right);
            this.TreeContentLog += node.Data;
        }
    }

    public GetExpression(): string {
        this.TreeContentLog = '';
        this.InOrderTraversal(this.RootNode);
        return this.TreeContentLog;
    }

    public ClearAll(): void {
        this.RootNode = null;
        this.TreeContentLog = '';
        this.BracketsPrecedenceLevel = this.BracketsPrecedenceLevelStart;
    }

    public RoundUpForDisplay(num: number, isFixed = true): string {
        if (isFixed) {
            return this.GetNumberWithCommas(num.toFixed(2));  //.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
        }
        return this.GetNumberWithCommas(num.toString());   //.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
    }

    public GetNumberWithCommas(num: string): string {
        var parts = num.toString().split(".");
        parts[0] = parts[0].replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
        return parts.join(".");
    }

    // #endregion

    // #region "Private Functions"

    // #region "Standard Mode Calculator"

    private AddToStandardMode(operator: string, operand: string) {
        if (operand.endsWith('%')) {
            operand = (parseFloat(operand.substr(0, operand.length - 1)) / 100).toString();
        }
        if (operator === '') {
            this.StandardCalculatorData.Result = parseFloat(operand);
        } else {
            this.StandardCalculatorData.Operand = parseFloat(operand);
            this.StandardCalculatorData.Operator = operator;
            this.StandardCalculatorData.Result = this.EvaluateExpression(this.StandardCalculatorData.Result
                , operator, this.StandardCalculatorData.Operand);
        }
    }

    private GetStandardCalculationValue(): string {
        let result: number = this.RoundUpNumber(this.StandardCalculatorData.Result);
        return this.FormatNumber(result);
    }
    // #endregion

    // #region Scientific Mode Calculator

    private AddToTree(operator: string, operand: string) {
        if (operand == null || this.IsScientificModeEnabled === false) {
            return;
        }

        let operatorNode: ExpressionNode = operator == null || operator === '' ? null : this.CreateNewNode(operator);
        let operandNode: ExpressionNode = this.CreateNewNode(operand);

        if (operatorNode != null && this.BracketsPrecedenceLevel > this.BracketsPrecedenceLevelStart) {
            operatorNode.PrecedenceOverrideLevel = this.BracketsPrecedenceLevel;
        }
        // The below Increment/Decrement will affect the precedence of next operator.
        if (operandNode.OpeningBrackets !== '') {
            this.BracketsPrecedenceLevel++;
        } else if (operandNode.ClosingBrackets !== '') {
            this.BracketsPrecedenceLevel--;
        }

        let explicitPrecedence = operatorNode == null ? 0 : operatorNode.PrecedenceOverrideLevel;
        this.RootNode = this.CreateExpressionTree(this.RootNode, operatorNode, operandNode,
            explicitPrecedence);
    }

    private CreateExpressionTree(rootNode: ExpressionNode, operatorNode: ExpressionNode,
        operandNode: ExpressionNode, explicitPrecedence: number): ExpressionNode {
        if (rootNode != null && operatorNode != null) {
            let rootPrecedence: number = this.GetPrecedence(rootNode.Data) + rootNode.PrecedenceOverrideLevel;
            let operatorPrecedence: number = this.GetPrecedence(operatorNode.Data) + operatorNode.PrecedenceOverrideLevel;

            if (rootPrecedence !== 0 && (rootPrecedence < operatorPrecedence || explicitPrecedence > this.BracketsPrecedenceLevelStart)) {
                if (explicitPrecedence > this.BracketsPrecedenceLevelStart) {
                    explicitPrecedence--;
                }
                rootNode.Right = this.CreateExpressionTree(rootNode.Right, operatorNode, operandNode, explicitPrecedence);
                return rootNode;
            }

            operatorNode.Left = rootNode;
            operatorNode.Right = operandNode;
            return operatorNode;
        } else {
            return operandNode;
        }
    }

    private CreateNewNode(data: string): ExpressionNode {
        let node: ExpressionNode = {
            OpeningBrackets: data.lastIndexOf('(') >= 0 ? data.substr(0, data.lastIndexOf('(') + 1) : '',
            Data: data.split('(').join('').split(')').join(''),
            ClosingBrackets: data.indexOf(')') >= 0 ? data.substr(data.indexOf(')'), data.length - data.indexOf(')')) : '',
            Left: null,
            Right: null,
            PrecedenceOverrideLevel: 0,
        };
        return node;
    }

    private GetTreeExpressionValue(): string {
        let result: number = this.RoundUpNumber(this.EvaluateTree(this.RootNode));
        return this.FormatNumber(result);
    }

    private EvaluateTree(rootNode: ExpressionNode): number {
        if (rootNode == null) {
            return 0;
        }

        if (rootNode.Left == null && rootNode.Right == null) {
            if (rootNode.Data.endsWith('%')) {
                return (parseFloat(rootNode.Data.substr(0, rootNode.Data.length - 1)) / 100);
            }
            return parseFloat(rootNode.Data);
        }

        let leftValue: number = this.EvaluateTree(rootNode.Left);
        let rightValue: number = this.EvaluateTree(rootNode.Right);

        return this.EvaluateExpression(leftValue, rootNode.Data, rightValue);
    }
    // #endregion

    // #region Common Functions

    private GetPrecedence(operator: string): number {
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

    private EvaluateExpression(leftValue: number, operator: string, rightValue: number): number {
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

    private FormatNumber(result: number): string {
        if ((result.toString().indexOf('.') < 0 && result.toString().length > this.TotalDigitsAllowed)
            ||
            (result.toString().indexOf('.') >= 0 && result.toString().length > (this.TotalDigitsAllowed + 3))
        ) {
            return result.toExponential(3);
        } else {
            return this.RoundUpForDisplay(result);
        }
    }

    private RoundUpNumber(num: number): number {
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
    OpeningBrackets: string;
    Left: ExpressionNode;
    Data: string;
    PrecedenceOverrideLevel: number;
    Right: ExpressionNode;
    ClosingBrackets: string;
}

interface StandardModeData {
    Operand: number;
    Operator: string;
    Result: number;
}
