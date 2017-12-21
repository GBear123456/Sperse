/**
 * Used for check pivot grid cells
 */

/**
 * @todo move to some general place
 * Constants
 */
const StartedBalance = 'B',
      Income         = 'I',
      Expense        = 'E',
      Reconciliation = 'D',
      Total          = 'T';

export class CashflowCellsChecker {

    cssMarker = ' @css';

    /**
     * whether or not the cell is balance sheet header
     * @param cellObj - the object that pivot grid passes to the onCellPrepared event
     * return bool
     */
    isStartingBalanceHeaderColumn(cellObj) {
        return cellObj.area === 'row' &&
            cellObj.cell.path !== undefined &&
            cellObj.cell.path.length === 1 &&
            cellObj.cell.rowspan === undefined &&
            cellObj.cell.path[0] === StartedBalance &&
            !cellObj.cell.isWhiteSpace;
    }

    /**
     * whether or not the cell is balance sheet data cell
     * @param cellObj - the object that pivot grid passes to the onCellPrepared event
     * return {boolean}
     */
    isStartingBalanceDataColumn(cellObj) {
        return cellObj.area === 'data' && cellObj.cell.rowPath !== undefined &&
            cellObj.cell.rowPath[0] === StartedBalance;
    }

    /**
     * whether or not the cell is balance sheet total data cell
     * @param cellObj - the object that pivot grid passes to the onCellPrepared event
     * return {boolean}
     */
    isStartingBalanceTotalDataColumn(cellObj) {
        return cellObj.area === 'data' && cellObj.cell.rowPath !== undefined &&
            cellObj.cell.rowPath[0] === StartedBalance &&
            (cellObj.cell.rowType === Total || cellObj.cell.rowPath.length === 1);
    }

    /**
     * whether or not the cell is income or expenses header cell
     * @param cellObj - the object that pivot grid passes to the onCellPrepared event
     * return {boolean}
     */
    isIncomeOrExpensesHeaderCell(cellObj) {
        return cellObj.area === 'row' && cellObj.cell.type === Total &&
            cellObj.cell.path.length === 1 &&
            (cellObj.cell.path[0] === Income || cellObj.cell.path[0] === Expense);
    }

    /**
     * whether or not the cell is income or expenses data cell
     * @param cellObj - the object that pivot grid passes to the onCellPrepared event
     * return {boolean}
     */
    isIncomeOrExpensesDataCell(cellObj) {
        return cellObj.area === 'data' &&
            cellObj.cell.rowPath !== undefined &&
            cellObj.cell.rowPath.length === 1 &&
            (cellObj.cell.rowPath[0] === Income || cellObj.cell.rowPath[0] === Expense);
    }

    /** Whether the cell is the ending cash position header cell */
    isTotalEndingHeaderCell(cellObj) {
        return cellObj.cell.path !== undefined &&
            cellObj.cell.path.length === 1 &&
            cellObj.cell.path[0] === Total &&
            !cellObj.cell.isWhiteSpace;
    }

    isIncomeOrExpenseWhiteSpace(cellObj) {
        return cellObj.cell.isWhiteSpace &&
            cellObj.cell.path.length === 1 &&
            (cellObj.cell.path[0] === Income || cellObj.cell.path[0] === Expense);
    }

    isStartingBalanceWhiteSpace(cellObj) {
        return cellObj.cell.isWhiteSpace &&
            cellObj.cell.path.length === 1 &&
            cellObj.cell.path[0] === StartedBalance;
    }

    /** Whether the cell is the ending cash position data cell */
    isTotalEndingDataCell(cellObj) {
        return cellObj.cell.rowPath !== undefined &&
            cellObj.cell.rowPath.length === 1 &&
            (cellObj.cell.rowPath[0] === Total);
    }

    isAllTotalBalanceCell(cellObj) {
        return cellObj.cell.rowPath !== undefined &&
            (cellObj.cell.rowPath[0] === Total);
    }

    isTotalRows(cellObj) {
        return cellObj.cell.rowPath !== undefined &&
            cellObj.cell.type === 'Total';
    }

    /** @todo check */
    isSubtotalRows(cellObj) {
        return cellObj.cell.rowPath !== undefined &&
            cellObj.cell.type === 'Total';
    }

    isTransactionRows(cellObj) {
        return cellObj.cell.rowPath !== undefined &&
            cellObj.cell.rowPath.length !== 1 &&
            (cellObj.cell.rowPath[0] === Income || cellObj.cell.rowPath[0] === Expense);
    }

    /** Whether the cell is the reconciliation header cell */
    isReconciliationHeaderCell(cellObj) {
        return cellObj.cell.path !== undefined &&
            cellObj.cell.path.length === 1 &&
            cellObj.cell.path[0] === Reconciliation &&
            !cellObj.cell.isWhiteSpace;
    }

    /** Whether the cell is the reconciliation data cell */
    isReconciliationDataCell(cellObj) {
        return cellObj.cell.rowPath !== undefined &&
            cellObj.cell.rowPath.length === 1 &&
            (cellObj.cell.rowPath[0] === Reconciliation);
    }

    /**
     * whether or not the cell is data cell
     * @param cellObj
     * @returns {boolean}
     */
    isDataCell(cellObj) {
        return cellObj.area === 'data';
    }

    /**
     * whether the cell is the historical cell
     * @param cellObj
     * @returns {boolean}
     */
    isHistoricalCell(cellObj) {
        return cellObj.rowIndex === 0;
    }

    /**
     * whether the cell contains the css marker for adding css to it
     * @param cellObj
     * @returns {boolean}
     */
    isCellContainsCssMarker(cellObj) {
        return cellObj.cell.text ? cellObj.cell.text.indexOf(this.cssMarker) !== -1 : '';
    }

}
