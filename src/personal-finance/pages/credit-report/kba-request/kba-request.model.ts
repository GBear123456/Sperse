import { RequestKBAInput } from '@shared/service-proxies/service-proxies';

export class KbaInputModel extends RequestKBAInput {
  redirectUrl: string;
  cssUrl = 'https://dl.dropboxusercontent.com/s/jfn70y0kyg4hoc1/kba-override.css';
}
