describe('template spec', () => {
  it('passes', () => {
 cy.clearCookies();
 cy.clearLocalStorage();
 cy.intercept('POST', '**/api/**/register*').as('register');
 const rand = (n = 8) => Math.random().toString(36).slice(2, 2 + n);
 const email = `user+${Date.now()}_${rand(4)}@mailinator.com`;
 cy.visit('https://www.yourstyle.space');

    cy.get('#login-link, a[href*="login"]')
      .first()
      .invoke('removeAttr', 'target')
      .click();
    cy.wait(100);

    cy.location('pathname').should('match', /\/login\.html$/);

    cy.get('a[href*="register"]')
      .first()
      .invoke('removeAttr', 'target')
      .click();
    cy.wait(1000);

    cy.location('pathname').should('match', /\/register\.html$/);

    cy.get('#reg-name').first().clear().type("testlogin");
    cy.get('#reg-email').first().type("doublemail@mail.com");
    cy.get('#reg-pass').first().clear().type(11111111);
    cy.get('#reg-form > button').invoke('removeAttr', 'target').click();


    cy.wait('@register').then(({ response }) => {
      expect(response.statusCode).to.eq(400);
      const msg = response.body?.error || response.body?.message || '';
      expect(msg).to.match(/user with this email already exists/i);
    });

   
    cy.get('#reg-error')
      .should('be.visible')
      .invoke('text')
      .then((t) => t.trim())
      .should('match', /user with this email already exists/i);

   
    cy.location('pathname').should('match', /\/register\.html$/);


    cy.get('#reg-name').first().clear().type("testlogin");
    cy.get('#reg-email, input[name="email"]').first().clear().type(email);
    cy.get('#reg-pass').first().clear().type(111);
    cy.get('#reg-form > button').invoke('removeAttr', 'target').click();

    cy.wait('@register').then(({ response }) => {
      expect(response.statusCode).to.eq(400);
      cy.location('pathname').should('match', /\/register\.html$/);
      });
    cy.get('#reg-name').first().clear().type("t");
    cy.get('#reg-email, input[name="email"]').first().clear().type(email);
    cy.get('#reg-pass').first().clear().type(11111111);
    cy.get('#reg-form > button').invoke('removeAttr', 'target').click();
    cy.wait('@register').then(({ response }) => {
      expect(response.statusCode).to.eq(400);
      cy.location('pathname').should('match', /\/register\.html$/);
      });
  




      });
});