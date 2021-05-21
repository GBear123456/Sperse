import { KeysEnum } from '@shared/common/keys.enum/keys.enum';
import { ReportDto } from '@app/cfo/reports/report-dto.interface';

export const ReportFields: KeysEnum<ReportDto> = {
    Id: 'Id',
    FileName: 'FileName',
    Size: 'Size',
    Departments: 'Departments',
    CreationTime: 'CreationTime',
    From: 'From',
    To: 'To',
    Type: 'Type',
    Template: 'Template'
};