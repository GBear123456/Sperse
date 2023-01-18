export interface EntityCheckListData {
    entity: { Id: number, Name: string, Email: string, Phone: string, CompanyName: string};
    pipelinePurposeId: string;
    contactGroupId: number;
}