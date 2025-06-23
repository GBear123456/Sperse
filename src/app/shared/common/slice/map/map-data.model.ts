export class MapData {
    [countryId: string]: {
        [stateId: string]: { name: string, total: number }
    }
}
