import { PlatformPage } from './app.po';

describe('abp-zero-template App', function () {
    let page: PlatformPage;

    beforeEach(() => {
        page = new PlatformPage();
    });

    it('should display message saying app works', () => {
        page.navigateTo();
        page.getCopyright().then(value => {
            expect(value).toEqual(new Date().getFullYear() + ' © Platform.');
        });
    });
});
