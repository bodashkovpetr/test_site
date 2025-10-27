describe('корзина без логина', () => {
  it('показывает алерт "Нужно войти" дважды при двух кликах', () => {
    cy.clearCookies();
    cy.clearLocalStorage();
    cy.visit('https://www.yourstyle.space/category-lamps.html');

    
    cy.window().then((win) => {
      cy.stub(win, 'alert').as('alert');
    });

    
    cy.get(':nth-child(1) > .row > button').click();
    cy.get(':nth-child(2) > .row > button').click();

    
    cy.get('@alert').should('have.been.called');                      
    cy.get('@alert').its('callCount').should('eq', 2);                 
    cy.get('@alert').should('always.have.been.calledWith', 'Нужно войти'); 
  });
});
