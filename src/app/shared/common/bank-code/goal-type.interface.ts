import { Observable } from 'rxjs';

export class GoalType {
    name: string;
    text: string;
    number: number;
    currentNumber$: Observable<number>;
    innerColor: string;
    outerColor: string;
}
