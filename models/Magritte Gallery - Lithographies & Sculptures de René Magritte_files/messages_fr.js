'use strict';

try {
  angular.module('cartAppTranslations');
} catch (e) {
  angular.module('cartAppTranslations', ['pascalprecht.translate']);
}

angular.module('cartAppTranslations').config(['$translateProvider',
  function ($translateProvider) {
    var translations = {
      'cartWidget': {
        'sr': {
          'PRODUCT_PRICE_BEFORE_DISCOUNT': 'Prix original',
          'PRODUCT_WAS_REMOVED': '{{ productName }} a été supprimé du panier',
          'PRODUCT_PRICE_WHEN_THERE_IS_NO_DISCOUNT': 'Prix',
          'PRODUCT_PRICE_AFTER_DISCOUNT': 'Prix promotionnel'
        }
      },
      'cartPopUp': {
        'itemsSubtotal': {
          'plural': 'Sous-total ({{numOfItems}} articles) :',
          'singular': 'Sous-total ({{numOfItems}} article) :'
        },
        'successMessage': {
          'title': 'Ajouté à votre panier'
        }
      },
      'CART_WIDGET_EMPTY_CART_MESSAGE': 'Le panier est vide',
      'CART_WIDGET_CURRENCY_CONVERTER_DISCLAIMER': 'Traité en {{mainCurrency}}',
      'CART_WIDGET_VIEW_CART_BUTTON': 'Voir le panier',
      'CART_WIDGET_CLOSE_CTA': 'Fermer',
      'OUT_OF_STOCK_TITLE': 'Rupture de stock',
      'CART_TABLE_TOTAL_TITLE': 'TOTAL',
      'CART_WIDGET_CLOSE_BUTTON_TITLE': 'Fermer panier',
      'SUBTOTAL_TITLE': 'Sous-total',
      'CART_WIDGET_QUANTITY_TITLE': 'QUANTITÉ : ',
      'REMOVE_PRODUCT_BUTTON_TITLE': 'Supprimer article',
      'SKU_TITLE': 'SKU (Unité de gestion des stocks) : {{ sku }}',
      'CART_WIDGET_CART_TITLE': 'Panier'
    };
    $translateProvider.translations('fr', translations);
    $translateProvider.translations(translations);
    $translateProvider.preferredLanguage('fr');
  }
]);