export interface ActivityDto {
    Id: number;
    Title: string;
    AllDay: boolean;
    StartDate: string;
    EndDate: string;
    Description: string;
    Type: string;
    AssignedUserIds: number[];
    LeadId: number;
    StageId: number;
    ContactId: number;
}