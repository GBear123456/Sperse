import * as _ from 'lodash';
import { PipelineDto, BankDto } from '@shared/service-proxies/service-proxies';

export class FilterHelpers {

    static ConvertPipelinesToTreeSource(data: PipelineDto[]): any[] {
        let result = [];
        data.forEach((pipeline, i) => {
            result.push({
                id: pipeline.id.toString(),
                parent: 0,
                name: pipeline.name
            });

            pipeline.stages.forEach((stage, j) => {
                result.push({
                    id: pipeline.id + ':' + stage.id,
                    parent: pipeline.name,
                    parentId: pipeline.id,
                    name: stage.name
                });
            });
        });

        return result;
    }

    static ParsePipelineIds(data: string[]) {
        let filterData = [];
        if (data) {
            data.forEach((id) => {
                let parts = id.split(':');
                filterData.push(parts.length == 2 ?
                    {
                        PipelineId: +parts[0],
                        StageId: +parts[1]
                    } : { PipelineId: +id });
            });
        }

        return filterData;
    }

    static ConvertBanksToTreeSource(data: BankDto[]): any[] {
        let result = [];
        
        data.forEach((bank, i) => {
            result.push({
                id: bank.id.toString(),
                parent: 0,
                name: bank.name
            });

            bank.bankAccounts.forEach((acc, j) => {
                result.push({
                    id: bank.id + ':' + acc.id,
                    parent: bank.name,
                    parentId: bank.id,
                    name: acc.accountName + ' (' + acc.accountNumber + ')'
                });
            });
        });

        return result;
    }
}
