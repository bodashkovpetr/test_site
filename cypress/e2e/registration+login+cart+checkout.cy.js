describe('Регистрация и логин', () => {
  it('регистрирует рандомного пользователя и логинит его', () => {
    cy.clearCookies();
    cy.clearLocalStorage();
    const rand = (n = 8) => Math.random().toString(36).slice(2, 2 + n);
    const email = `user+${Date.now()}_${rand(4)}@mailinator.com`;
    const name = `Test-${rand(6)}`;
    const password = `Pa$${rand(6)}${Cypress._.random(1000, 9999)}`;

    cy.intercept('POST', '**/api/**/register*').as('register');
    cy.intercept('POST', '**/api/**/login*').as('login');
    cy.intercept('POST', '**/api/**/orders*').as('orders');

    cy.visit('https://www.yourstyle.space');

    cy.get('#login-link, a[href*="login"]')
      .first()
      .invoke('removeAttr', 'target')
      .click();
    cy.wait(1000);

    cy.location('pathname').should('match', /\/login\.html$/);

    cy.get('a[href*="register"]')
      .first()
      .invoke('removeAttr', 'target')
      .click();
    cy.wait(1000);

    cy.location('pathname').should('match', /\/register\.html$/);

    cy.get('#reg-name, input[name="name"]').first().clear().type(name);
    cy.get('#reg-email, input[name="email"]').first().clear().type(email);
    cy.get('#reg-pass,  input[name="password"]').first().clear().type(password);

    cy.get('#reg-form > button')
      
      .click();
    cy.wait(1000);

    cy.wait('@register').its('response.statusCode').should('be.oneOf', [201]);

    cy.get('#login-email, #login-form input[name="email"]').first().clear().type(email);
    cy.get('#login-pass,  #login-form input[name="password"]').first().clear().type(password);

    cy.get('#login-form > button')
      .first()
      .click();
    cy.wait(1000);

    cy.wait('@login').its('response.statusCode').should('be.oneOf', [200]);

    cy.wrap({ name, email, password }).as('user');

    cy.get('#nav-links > [href="index.html"]')
    .invoke('removeAttr', 'target')
    .click();
    cy.wait(100);
    cy.get('.row > button')
    .invoke('removeAttr', 'target')
    .click();
    cy.wait(100);
    cy.get('[href="category-tables.html"]')
    .invoke('removeAttr', 'target')
    .click();
    cy.wait(100);
    cy.location('pathname').should('match', /\/category-tables\.html$/);
    cy.get(':nth-child(1) > .row > button')
    .invoke('removeAttr', 'target')
    .click();
    cy.wait(100);
    cy.get(':nth-child(2) > .row > button')
    .invoke('removeAttr', 'target')
    .click();
    cy.wait(100);
    cy.get(':nth-child(3) > .row > button')
    .invoke('removeAttr', 'target')
    .click();
    cy.wait(100);

    cy.get('[href="category-lamps.html"]')
    .invoke('removeAttr', 'target')
    .click();
    cy.wait(100);
    cy.location('pathname').should('match', /\/category-lamps\.html$/);
    cy.get(':nth-child(1) > .row > button')
    .invoke('removeAttr', 'target')
    .click();
    cy.wait(100);
    cy.get(':nth-child(2) > .row > button')
    .invoke('removeAttr', 'target')
    .click();
    cy.wait(100);
    cy.get(':nth-child(3) > .row > button')
    .invoke('removeAttr', 'target')
    .click();
    cy.wait(100);
    cy.get('[href="category-chairs.html"]')
    .invoke('removeAttr', 'target')
    .click();
    cy.wait(100);
    cy.location('pathname').should('match', /\/category-chairs\.html$/);
    cy.get(':nth-child(1) > .row > button')
    .invoke('removeAttr', 'target')
    .click();
    cy.wait(100);
    cy.get(':nth-child(2) > .row > button')
    .invoke('removeAttr', 'target')
    .click();
    cy.wait(100);
    cy.get(':nth-child(3) > .row > button')
    .invoke('removeAttr', 'target')
    .click();
    cy.wait(100);
    cy.get('#cart-link')
    .invoke('removeAttr', 'target')
    .click();
    cy.wait(100);
    cy.get('#checkout-btn')
    .invoke('removeAttr', 'target')
    .click();
    cy.wait('@orders').its('response.statusCode').should('be.oneOf', [201]);

  });
});