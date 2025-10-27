describe('template spec', () => {
  it('переход в "Столы"', () => {
    cy.clearCookies();
    cy.clearLocalStorage();
    cy.visit('https://www.yourstyle.space'); 
    

    cy.get('a[href="category-tables.html"], a[href="/category-tables.html"]')
      .first()
      .invoke('removeAttr', 'target') 
      .click();

    cy.location('pathname').should('match', /\/category-tables\.html$/);


    
    cy.get('a[href="category-lamps.html"], a[href="/category-lamps.html"]')
      .first()
      .invoke('removeAttr', 'target') 
      .click();

    cy.location('pathname').should('match', /\/category-lamps\.html$/);

    
    cy.get('a[href="category-chairs.html"], a[href="/category-chairs.html"]')
      .first()
      .invoke('removeAttr', 'target') 
      .click();

    cy.location('pathname').should('match', /\/category-chairs\.html$/);
  });
});