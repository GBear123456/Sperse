import { AppConsts } from '@shared/AppConsts';

export class ValidationHelper {
    static ValidateName(name: string): boolean {
        return AppConsts.regexPatterns.fullName.test(name);
    }
}
