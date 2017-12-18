export enum GeneralScope {
    TransactionRows = 1,
    SubtotalRows = 2,
    TotalRows = 4,
    BeginningBalances = 8,
    EndingBalances = 16
}

export enum PeriodScope {
    Day = 1,
    Week = 2,
    Month = 4,
    Quarter = 8,
    Year = 16
}
