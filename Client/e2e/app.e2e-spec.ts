import { CRMPage } from './app.po';

describe('abp-zero-template App', function() {
  let page: CRMPage;

  beforeEach(() => {
    page = new CRMPage();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
});
