import * as dateHelpers from "../../../resources/js/helpers/dateHelpers.js";

describe('Paper Manifest Vue', () => {
    let acmeDevPresets, alamoPresets, randomOrderNum, paperDocTypes1, fakeManifest, fakePrintManifest;
    before(function () {

        cy.fixture('PaperManifest/acmedevPresets').then(json => {
            acmeDevPresets = json;
        });

        cy.fixture('PaperManifest/alamoPresets').then(json => {
            alamoPresets = json;
        });

        cy.fixture('PaperManifest/doctypes-1').then(json => {
            paperDocTypes1 = json;
        });

        cy.fixture('PaperManifest/fakeManifest').then(json => {
            fakeManifest = json;
        });

        cy.fixture('PaperManifest/fakePrintManifest').then(json => {
            fakePrintManifest = json;
        });
    });

    context('Initialization', () => {
        it('Login to CORE and goes to Paper Manifest Vue', () => {
            cy.login(Cypress.env('username'), Cypress.env('password'));
            cy.visit('/CreatePaperManifestVue');
            cy.location('pathname').should('eq', '/CreatePaperManifestVue');
        });
    });

    context('Top form interaction', () => {
        it('Top action buttons should be disabled on page load', () => {
            cy.get('header .btns').each($btn => {
                expect($btn).to.have.class('disable');
            })
        });

        it('Selects "AcmeDev" and title officers dropdown populates', () => {
            cy.get('[data-cy=customer-selector] .multiselect__select').click();
            cy.server();
            cy.route(() => {
                return {
                    method: 'POST',
                    url: '/loadPaperPresets',
                    response: acmeDevPresets
                }
            });
            cy.get('[data-cy=customer-selector] .multiselect__element').first().click();
            cy.checkAndSelect('[data-cy="title-officer-selector"]');
        });

        it('State dropdown is populated', () => {
            cy.checkAndSelect('[data-cy=state-selector]');
        });

        it('County dropdown is populated after state selection', () => {
            cy.checkAndSelect('[data-cy=county-selector]');
        });

        it('Record dropdown is populated after Customer selection', () => {
            cy.checkAndSelect('[data-cy=record-selector]');
        });

        it('Ordertype selection and transtype selection should be present and have options', () => {
            cy.get('[data-cy="ordertype-selector"]').should('be.visible');
            cy.checkAndSelect('[data-cy="ordertype-selector"]');
            cy.get('[data-cy="transtype-selector"]').should('be.visible');
            cy.checkAndSelect('[data-cy="transtype-selector"]');
        });

        it('Shows a row after all fields are filled out or selected', () => {
            const currentbizDay = dateHelpers.getFormattedDate(dateHelpers.getValidBizDateRange().start);
            cy.get('[data-cy="datepicker"]').type(currentbizDay).blur();
            cy.get('[data-cy="manifest-table"]').should('be.visible');
        });

        it('Selecting Alamo Title company should hide the table, transtype and ordertype fields should automatically populate with "Not Used"', () => {
            cy.get('[data-cy=customer-selector] .multiselect__select').click();
            cy.server();
            cy.route(() => {
                return {
                    method: 'POST',
                    url: '/loadPaperPresets',
                    response: alamoPresets
                }
            });
            cy.get('[data-cy=customer-selector] .multiselect__element').eq(1).click();
            cy.get('[data-cy="ordertype-selector"] span.multiselect__single').should('be.visible').and('have.text', 'Not Used');
            cy.get('[data-cy="transtype-selector"] span.multiselect__single').should('be.visible').and('have.text', 'Not Used');
        });

        it('After Alamo selection, title officer, state, county and record dropdowns should be clear', () => {
            cy.get('[data-cy="title-officer-selector"] span.multiselect__placeholder').should('be.visible').and('contain', 'Select One');
            cy.get('[data-cy="state-selector"] span.multiselect__placeholder').should('be.visible').and('contain', 'Select One');
            cy.get('[data-cy="county-selector"] span.multiselect__placeholder').should('be.visible').and('contain', 'Select One');
            cy.get('[data-cy="record-selector"] span.multiselect__placeholder').should('be.visible').and('contain', 'Select One');
        });
    });

    context('Row Interaction', () => {
        it('Should call createManifest once order number is inputted and a doctype is selected', () => {
            cy.server();
            cy.route(() => {
                return {
                    method: 'POST',
                    url: '/loadPaperPresets',
                    response: acmeDevPresets
                }
            });
            cy.checkAndSelect('[data-cy="customer-selector"]');
            cy.checkAndSelect('[data-cy="title-officer-selector"]');
            cy.get('[data-cy="state-selector"] .multiselect__select').click();
            cy.get('[data-cy="state-selector"] .multiselect__element').eq(4).click();
            cy.get('[data-cy="county-selector"] .multiselect__select').click();
            cy.route(() => {
                return {
                    method: 'GET',
                    url: '/getPaperDocTypes/1',
                    response: paperDocTypes1
                }
            });
            cy.get('[data-cy="county-selector"] .multiselect__element').eq(18).click();
            cy.checkAndSelect('[data-cy="record-selector"]');
            cy.checkAndSelect('[data-cy="transtype-selector"]');
            cy.checkAndSelect('[data-cy="ordertype-selector"]');

            randomOrderNum = `9${Cypress._.random(0, 9)}${Cypress._.random(0, 9)}${Cypress._.random(0, 9)}${Cypress._.random(0, 9)}${Cypress._.random(0, 9)}1`;
            cy.get('[data-cy="ordernum-input"]').type(randomOrderNum);
            cy.route(() => {
                return {
                    method: 'POST',
                    url: '/createManifest',
                    response: {
                        head: {
                            ...fakeManifest.head,
                            orderNumber: randomOrderNum
                        },

                        rows: [
                            {
                                ...fakeManifest.rows[0],
                                orderNumber: randomOrderNum
                            }
                        ]
                    }
                }
            });
            cy.checkAndSelect('[data-cy="doctype-selector"]');
        });

        it('Top action buttons should be enabled after manifest is created', () => {
            cy.get('header .btns').each($btn => {
                expect($btn).to.not.have.class('disable');
            })
        });

        it('Manifest ID field should be populated after manifest is created', () => {
            cy.get('[data-cy="sticker-input"]').should('be.visible').then(($el) => {
                expect($el).to.have.value('264687');
            });
        });

    });

    context('Saving Manifest', () => {
        it('Saving draft will call to PostManifest', () => {
            cy.server();
            cy.route(() => {
                return {
                    method: 'POST',
                    url: '/PostManifest',
                    response: {}
                }
            });
            cy.get('[data-cy="save-btn"]').click();
        });
    });

    context('Printing Manifest', () => {
        it('Finalizing manifest will ajax to PrintManifest and PDF viewer modal will appear', () => {
            cy.server();
            cy.route(() => {
                return {
                    method: 'POST',
                    url: '/loadPaperPresets',
                    response: acmeDevPresets
                }
            });
            cy.checkAndSelect('[data-cy="customer-selector"]');
            cy.checkAndSelect('[data-cy="title-officer-selector"]');
            cy.get('[data-cy="state-selector"] .multiselect__select').click();
            cy.get('[data-cy="state-selector"] .multiselect__element').eq(4).click();
            cy.get('[data-cy="county-selector"] .multiselect__select').click();
            cy.route(() => {
                return {
                    method: 'GET',
                    url: '/getPaperDocTypes/1',
                    response: paperDocTypes1
                }
            });
            cy.get('[data-cy="county-selector"] .multiselect__element').eq(18).click();
            cy.checkAndSelect('[data-cy="record-selector"]');
            cy.checkAndSelect('[data-cy="transtype-selector"]');
            cy.checkAndSelect('[data-cy="ordertype-selector"]');
            const currentbizDay = dateHelpers.getFormattedDate(dateHelpers.getValidBizDateRange().start);
            cy.get('[data-cy="datepicker"]').type(currentbizDay).blur();
            cy.get('[data-cy="manifest-table"]').should('be.visible');
            randomOrderNum = `9${Cypress._.random(0, 9)}${Cypress._.random(0, 9)}${Cypress._.random(0, 9)}${Cypress._.random(0, 9)}${Cypress._.random(0, 9)}1`;
            cy.get('[data-cy="ordernum-input"]').type(randomOrderNum);
            cy.route(() => {
                return {
                    method: 'POST',
                    url: '/createManifest',
                    response: {
                        head: {
                            ...fakeManifest.head,
                            orderNumber: randomOrderNum
                        },

                        rows: [
                            {
                                ...fakeManifest.rows[0],
                                orderNumber: randomOrderNum
                            }
                        ]
                    }
                }
            });
            cy.checkAndSelect('[data-cy="doctype-selector"]');
            cy.route(() => {
                return {
                    method: 'POST',
                    url: '/PrintManifest',
                    response: fakePrintManifest
                }
            });
            cy.get('[data-cy="finalize-btn"]').click();
            cy.get('.pdf-modal').should('be.visible');
            cy.get('.btn-close > .fa-times').click();

        });
    });

    context('Cancelling Manifest', () => {
        beforeEach(() => {
            cy.server();
            cy.route(() => {
                return {
                    method: 'POST',
                    url: '/loadPaperPresets',
                    response: acmeDevPresets
                }
            });
            cy.checkAndSelect('[data-cy="customer-selector"]');
            cy.checkAndSelect('[data-cy="title-officer-selector"]');
            cy.get('[data-cy="state-selector"] .multiselect__select').click();
            cy.get('[data-cy="state-selector"] .multiselect__element').eq(4).click();
            cy.get('[data-cy="county-selector"] .multiselect__select').click();
            cy.route(() => {
                return {
                    method: 'GET',
                    url: '/getPaperDocTypes/1',
                    response: paperDocTypes1
                }
            });
            cy.get('[data-cy="county-selector"] .multiselect__element').eq(18).click();
            cy.checkAndSelect('[data-cy="record-selector"]');
            cy.checkAndSelect('[data-cy="transtype-selector"]');
            cy.checkAndSelect('[data-cy="ordertype-selector"]');

            const currentbizDay = dateHelpers.getFormattedDate(dateHelpers.getValidBizDateRange().start);
            cy.get('[data-cy="datepicker"]').type(currentbizDay).blur();
            cy.get('[data-cy="manifest-table"]').should('be.visible');
            randomOrderNum = `9${Cypress._.random(0, 9)}${Cypress._.random(0, 9)}${Cypress._.random(0, 9)}${Cypress._.random(0, 9)}${Cypress._.random(0, 9)}1`;
            cy.get('[data-cy="ordernum-input"]').type(randomOrderNum);
            cy.route(() => {
                return {
                    method: 'POST',
                    url: '/createManifest',
                    response: {
                        head: {
                            ...fakeManifest.head,
                            orderNumber: randomOrderNum
                        },

                        rows: [
                            {
                                ...fakeManifest.rows[0],
                                orderNumber: randomOrderNum
                            }
                        ]
                    }
                }
            });
            cy.checkAndSelect('[data-cy="doctype-selector"]');
            cy.route(() => {
                return {
                    method: 'POST',
                    url: '/cancelManifest/acmedev/850000300000264687',
                    response: 1
                }
            }).as('cancelManifest');

        });
        it('Cancel will ajax to cancelManifest', () => {
            cy.get('[data-cy="cancel-btn"]').click();
        });

        it('Cancelling one completed row will show Cancel Order modal and perform ajax to cancelManifest', () => {
            cy.get('.cancel-btn .fa-times').first().click();
            cy.get('.confirm-modal').should('be.visible');
            cy.get('.confirm-reject-btns-container > .text-red').click();
            cy.wait('@cancelManifest').then((xhr) => {
                assert.isNotNull(xhr.response.body.data, 'ajax to cancel manifest has been called!');
            })
        });
    });
});