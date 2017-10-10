export class Operation {
    id: number;
    group: string;
    type: 'income' | 'expense';
    subgroup: string;
    name: string;
    amount: number;
    date: string;
}