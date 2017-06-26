import { CasterClientPage } from './app.po';

describe('caster-client App', () => {
  let page: CasterClientPage;

  beforeEach(() => {
    page = new CasterClientPage();
  });

  it('should display welcome message', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('Welcome to app!!');
  });
});
