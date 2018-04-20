import { Injectable } from '@angular/core';
import { Subject } from 'rxjs/Subject';

@Injectable()
export class CellsCopyingService {

    constructor() { }

    /** Cross triangle element */
    public elem;

    /** Cell to be copied (dxPivotGridPivotGridCell) interface */
    public copiedCell;

    /** Table of copied cell */
    private copiedCellTable;

    /** Selected Cells to copy */
    private selectedCellsToCopy: HTMLTableCellElement[] = [];

    /** Prop to restore the old draggable status */
    private copiedCellIsDraggable: boolean;

    /** Marker of the status of copying */
    private copyingProcessStarted: boolean;

    private selectedCellsToCopyChange = new Subject<HTMLTableCellElement[]>();

    public selectedCellsToCopyChange$ = this.selectedCellsToCopyChange.asObservable();

    private selectedCellsToCopyFinished = new Subject<HTMLTableCellElement[]>();

    public selectedCellsToCopyFinished$ = this.selectedCellsToCopyFinished.asObservable();

    /** Default styles for triangle element */
    private crossMovingTriangleDefaultStyles = {
        width: 0,
        height: 0,
        borderBottom: '5px solid #fab800',
        borderLeft: '5px solid transparent',
        cursor: 'crosshair',
        position: 'absolute',
        right: 0,
        bottom: 0,
        zIndex: 2
    };

    public isCrossCellCursor(element: HTMLElement) {
        return element.id === 'crossMovingTriangle';
    }
    /**
     * Create triangle element if it is not created and add events to document for listening of mouse down and up
     * @param {Css} styles
     * @return {HTMLElement}
     */
    public getCrossMovingTriangle(styles = this.crossMovingTriangleDefaultStyles) {
        this.elem = document.getElementById('crossMovingTriangle');
        if (!this.elem) {
            this.elem = document.createElement('div');
            this.elem.id = 'crossMovingTriangle';
            Object.assign(this.elem.style, this.crossMovingTriangleDefaultStyles, styles);
            document.addEventListener('mousedown', this.onMouseDown, true); 
            document.addEventListener('mouseup', this.onMouseUp);
        }
        return this.elem;
    }

    /**
     * Return if two segments intersect each other
     * @param startPoint
     * @param endPoint
     * @return {boolean}
     */
    private getIntersection( startPoint, endPoint ): boolean {
        let [ax1, ay1, ax2, ay2] = startPoint;
        let [bx1, by1, bx2, by2] = endPoint ;
        let v1 = (bx2 - bx1) * (ay1 - by1) - (by2 - by1) * (ax1 - bx1);
        let v2 = (bx2 - bx1) * (ay2 - by1) - (by2 - by1) * (ax2 - bx1);
        let v3 = (ax2 - ax1) * (by1 - ay1) - (ay2 - ay1) * (bx1 - ax1);
        let v4 = (ax2 - ax1) * (by2 - ay1) - (ay2 - ay1) * (bx2 - ax1);
        return v1 * v2 < 0 && v3 * v4 < 0;
    }

    private onMouseDown = e => {
        if (this.isCrossCellCursor(e.target)) {
            this.selectedCellsToCopy = [];
            let copiedCellElement: any = e.target.parentElement;
            this.copiedCell = copiedCellElement;
            this.copiedCellTable = this.copiedCell.closest('table');
            /** To stop drag event of cell */
            if (copiedCellElement.getAttribute('draggable') === 'true') {
                this.copiedCellIsDraggable = true;
                copiedCellElement.setAttribute('draggable', 'false');
            }
            document.addEventListener('mousemove', this.onMouseMove);
            this.copiedCellTable.style.cursor = 'crosshair';
            this.copyingProcessStarted = true;
            e.stopPropagation();
        }
    }

    private onMouseUp = e => {
        if (this.copyingProcessStarted) {
            /** Logic for copying to a few cells */
            if (this.selectedCellsToCopy.length) {
                /** Remove selected clases and crossMovingTriangle element */
                this.selectedCellsToCopyFinished.next(this.selectedCellsToCopy);
            }
            this.selectedCellsToCopy = [];
            /** To restore draggable status of the copied cell */
            if (this.copiedCellIsDraggable) {
                this.copiedCell.setAttribute('draggable', 'true');
                this.copiedCellIsDraggable = false;
            }
            document.removeEventListener('mousemove', this.onMouseMove);
            this.copiedCellTable.style.cursor = 'default';
            this.copyingProcessStarted = false;
        }
    }

    onMouseMove = e => {
        let targetCell = e.target.closest('td');
        if (targetCell && targetCell.closest('table') === this.copiedCellTable) {
            /** Check position of cursor */
            let copiedCellCoords = this.copiedCell.getBoundingClientRect();
            let quarterCellWidth = copiedCellCoords.width / 4;
            let quarterCellHeight = copiedCellCoords.height / 4;
            let startedMovingAreaBoundaries = {
                leftTop: {x: copiedCellCoords.left - quarterCellWidth, y: copiedCellCoords.top - quarterCellHeight},
                rightTop: {x: copiedCellCoords.right + quarterCellWidth, y: copiedCellCoords.top - quarterCellHeight},
                leftBottom: {x: copiedCellCoords.left - quarterCellWidth, y: copiedCellCoords.bottom + quarterCellHeight},
                rightBottom: {x: copiedCellCoords.right + quarterCellWidth, y: copiedCellCoords.bottom + quarterCellHeight}
            };
            let borders = {
                'top': [
                    startedMovingAreaBoundaries.leftTop.x,
                    startedMovingAreaBoundaries.leftTop.y,
                    startedMovingAreaBoundaries.rightTop.x,
                    startedMovingAreaBoundaries.rightTop.y,
                ],
                'left': [
                    startedMovingAreaBoundaries.leftTop.x,
                    startedMovingAreaBoundaries.leftTop.y,
                    startedMovingAreaBoundaries.leftBottom.x,
                    startedMovingAreaBoundaries.leftBottom.y
                ],
                'right': [
                    startedMovingAreaBoundaries.rightTop.x,
                    startedMovingAreaBoundaries.rightTop.y,
                    startedMovingAreaBoundaries.rightBottom.x,
                    startedMovingAreaBoundaries.rightBottom.y
                ],
                'bottom': [
                    startedMovingAreaBoundaries.leftBottom.x,
                    startedMovingAreaBoundaries.leftBottom.y,
                    startedMovingAreaBoundaries.rightBottom.x,
                    startedMovingAreaBoundaries.rightBottom.y,
                ]
            };
            let cellsSelectingDirection;
            if (
                e.clientX > (copiedCellCoords.right + quarterCellWidth) ||
                e.clientY < (copiedCellCoords.top - quarterCellHeight) ||
                e.clientY > (copiedCellCoords.bottom + quarterCellHeight) ||
                e.clientX < (copiedCellCoords.left - quarterCellWidth)
            ) {

                let firstStartedPoint = {x: copiedCellCoords.left - quarterCellWidth / 2, y: copiedCellCoords.top + copiedCellCoords.height / 2};
                let secondStartedPoint = {x: copiedCellCoords.right + quarterCellWidth / 2, y: copiedCellCoords.top + copiedCellCoords.height / 2};

                let closestPoint = (e.clientX - firstStartedPoint.x) < (secondStartedPoint.x - e.clientX) ? firstStartedPoint : secondStartedPoint;
                let mouseVector = [
                    closestPoint.x,
                    closestPoint.y,
                    e.clientX,
                    e.clientY,
                ];
                for (let border in borders) {
                    if (this.getIntersection(mouseVector, borders[border])) {
                        cellsSelectingDirection = this.getDirectionFromBorder(border);
                    }
                }
            }

            this.selectedCellsToCopy = [];

            if (cellsSelectingDirection) {
                this.changeSelectedCells(cellsSelectingDirection, this.copiedCell, targetCell);
            }
            this.selectedCellsToCopyChange.next(this.selectedCellsToCopy);
        }
    }

    private changeSelectedCells(cellsSelectingDirection, copiedCell, targetCell) {
        let copiedCellIndex = copiedCell.cellIndex;
        let copiedRowIndex = copiedCell.parentElement.rowIndex;

        let targetRow = targetCell.parentElement;
        let targetCellIndex = targetCell.cellIndex;
        let targetRowIndex = targetRow.rowIndex;

        let startItemIndex = cellsSelectingDirection === 'vertical' ? copiedRowIndex : copiedCellIndex;
        let endItemIndex = cellsSelectingDirection === 'vertical' ? targetRowIndex : targetCellIndex;
        let endItemIsAfter = endItemIndex > startItemIndex;

        let i = endItemIsAfter ? startItemIndex + 1 : startItemIndex - 1;
        while (endItemIsAfter ? i <= endItemIndex : i >= endItemIndex) {
            let tbody = <any>targetCell.closest('tbody');
            let stableIndex = startItemIndex === copiedRowIndex ? copiedCellIndex : copiedRowIndex;
            let newCell = cellsSelectingDirection === 'horizontal' ? tbody.rows[stableIndex].cells[i] : tbody.rows[i].cells[stableIndex];
            if (this.selectedCellsToCopy.indexOf(newCell) === -1) {
                this.selectedCellsToCopy.push(newCell);
            }
            endItemIsAfter ? i++ : i--;
        }
    }

    getDirectionFromBorder(border): 'horizontal' | 'vertical' {
        return border === 'top' || border === 'bottom' ? 'vertical' : ( border === 'left' || border === 'right' ? 'horizontal' : null );
    }

}
