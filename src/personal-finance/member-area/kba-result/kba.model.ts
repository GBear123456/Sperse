import { KBAResult } from '@shared/service-proxies/service-proxies';

export class KbaInputModel extends KBAResult {
  memberId: string;
  passed: boolean;
  err: string;
}
