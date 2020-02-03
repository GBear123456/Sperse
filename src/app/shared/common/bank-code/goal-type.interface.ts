import { Observable } from 'rxjs';

export class GoalType {
    name: string;
    text: string;
    number: number;
    currentNumber$: Observable<string>;
    innerColor: string;
    outerColor: string;
}
