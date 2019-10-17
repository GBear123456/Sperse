import { MapArea } from '@app/shared/common/slice/map/map-area.enum';

export class MapAreaItem {
    key: MapArea;
    name: string;
    map: any;
    zoomFactor: number;
    bounds?: number[];
}
