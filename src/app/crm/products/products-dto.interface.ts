export interface ProductDto {
    Id: number;
    Code: string;
    Name: string;
    Description: string;
    Group: string;
    Type: string;
    Price: number;
    Unit: string;
    ThumbnailUrl: string;
    PublicName: string;
    CreateUser: boolean;
    IsPublished: boolean;
    AllowCoupon: boolean;
    PublishDate: string;
}