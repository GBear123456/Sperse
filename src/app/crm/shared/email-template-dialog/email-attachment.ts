import { AttachmentDto } from '@shared/service-proxies/service-proxies';
import { Subscription } from 'rxjs';
import { SafeResourceUrl } from '@angular/platform-browser';

export class EmailAttachment extends AttachmentDto {
    progress!: number;
    xhr!: XMLHttpRequest;
    loader!: Subscription;
    url!: SafeResourceUrl;
}