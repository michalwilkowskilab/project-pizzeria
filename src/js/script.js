/* global Handlebars, utils, dataSource */ // eslint-disable-line no-unused-vars

{
  'use strict';

  const select = {
    templateOf: {
      menuProduct: '#template-menu-product',
    },
    containerOf: {
      menu: '#product-list',
      cart: '#cart',
    },
    all: {
      menuProducts: '#product-list > .product',
      menuProductsActive: '#product-list > .product.active',
      formInputs: 'input, select',
    },
    menuProduct: {
      clickable: '.product__header',
      form: '.product__order',
      priceElem: '.product__total-price .price',
      imageWrapper: '.product__images',
      amountWidget: '.widget-amount',
      cartButton: '[href="#add-to-cart"]',
    },
    widgets: {
      amount: {
        input: 'input[name="amount"]',
        linkDecrease: 'a[href="#less"]',
        linkIncrease: 'a[href="#more"]',
      },
    },
  };

  const classNames = {
    menuProduct: {
      wrapperActive: 'active',
      imageVisible: 'active',
    },
  };

  const settings = {
    amountWidget: {
      defaultValue: 1,
      defaultMin: 1,
      defaultMax: 9,
    }
  };

  const templates = {
    menuProduct: Handlebars.compile(document.querySelector(select.templateOf.menuProduct).innerHTML),
  };

  class Product{
    constructor(id, data){
      const thisProduct = this;

      thisProduct.id = id;
      thisProduct.data = data;

      thisProduct.renderInMenu();
      thisProduct.getElements();
      thisProduct.initAccordion();
      thisProduct.initOrderForm();
      thisProduct.initAmountWidget();
      thisProduct.processOrder();
      console.log('new Product:', thisProduct);
    }
    renderInMenu(){
      const thisProduct = this;

      /* generate HTML based on template*/
      const generatedHTML = templates.menuProduct(thisProduct.data);
      //console.log(generatedHTML);

      /* create element using utils.createElementFromHTML */
      thisProduct.element = utils.createDOMFromHTML(generatedHTML);

      /* find menu container */
      const menuContainer = document.querySelector(select.containerOf.menu);

      /* add element to menu */
      menuContainer.appendChild(thisProduct.element);
    }

    getElements(){
      const thisProduct = this;
      //console.log('getElements', thisProduct);

      thisProduct.accordionTrigger = thisProduct.element.querySelector(select.menuProduct.clickable);
      thisProduct.form = thisProduct.element.querySelector(select.menuProduct.form);
      thisProduct.formInputs = thisProduct.form.querySelectorAll(select.all.formInputs);
      thisProduct.cartButton = thisProduct.element.querySelector(select.menuProduct.cartButton);
      thisProduct.priceElem = thisProduct.element.querySelector(select.menuProduct.priceElem);
      thisProduct.imageWrapper = thisProduct.element.querySelector(select.menuProduct.imageWrapper);
      thisProduct.amountWidgetElem = thisProduct.element.querySelector(select.menuProduct.amountWidget);
    }


    initAccordion(){
      const thisProduct = this;
      //console.log(thisProduct);
      /* START: click event listener to trigger */
      const buttonClicked = thisProduct.element.querySelector(select.menuProduct.clickable);
      buttonClicked.addEventListener('click', function(event){
        //console.log('clicked');
        /* prevent default action for event */
        event.preventDefault();
        /* find all active products */
        const activeProducts = document.querySelectorAll('article.product.active');
        /* START LOOP: for each active product */
        for(let active of activeProducts){
          /* remove class active for the active product */
          active.classList.remove('active');
        /* END LOOP: for each active product */
        }
        thisProduct.element.classList.add('active');
        /* END: click event listener to trigger */
      });
    }

    initOrderForm(){
      const thisProduct = this;
      //console.log('initOrderForm', thisProduct);

      thisProduct.form.addEventListener('submit', function(event){
        event.preventDefault();
        thisProduct.processOrder();
      });

      for(let input of thisProduct.formInputs){
        input.addEventListener('change', function(){
          thisProduct.processOrder();
        });
      }

      thisProduct.cartButton.addEventListener('click', function(event){
        event.preventDefault();
        thisProduct.processOrder();
      });
    }

    processOrder(){
      const thisProduct = this;
      //console.log('processOrder', thisProduct);

      /* read all data from the form (using utils.serializeFormToObject) and save it to const formData */
      const formData = utils.serializeFormToObject(thisProduct.form);
      //console.log('formData', formData);

      /* set variable price to equal thisProduct.data.price */
      let price = thisProduct.data.price;
      //console.log('Price:', price);
      /* START LOOP: for each paramId in thisProduct.data.params */
      /* save the element in thisProduct.data.params with key paramId as const param */
      for(let param in thisProduct.data.params){
        //console.log('Params:', param, thisProduct.data.params[param]);
        let params = thisProduct.data.params[param];
        //console.log(params);
        /* START LOOP: for each optionId in param.options */
        /* save the element in param.options with key optionId as const option */
        for(let option in params.options){
          //console.log('Options:', option);
          let options = params.options[option];
          //console.log('options', options);
          /* START IF: if option is selected and option is not default */
          const optionSelected = formData.hasOwnProperty(param) && formData[param].indexOf(option) > -1;
          //console.log('optionSelected:', options.default);
          if(optionSelected && !options.default){
          /* add price of option to variable price */
            price = price + options.price;
          /* END IF: if option is selected and option is not default */
          }
          /* START ELSE IF: if option is not selected and option is default */
          /* deduct price of option from price */
          else if(!optionSelected && options.default){
          /* END ELSE IF: if option is not selected and option is default */
            price = price - options.price;
          }
          /* Start block if and else with loop */
          const images = thisProduct.imageWrapper.querySelectorAll('img');
          //console.log('images:', images);

          for(let image of images){
            //console.log('image:', image);
            const className = param +'-'+ option;
            //console.log('className:', className);
            if(image.classList.contains(className) && optionSelected){
              image.classList.add('active');
            }
            else if(image.classList.contains(className) && !optionSelected){
              image.classList.remove('active');
            }
          }
        /* END LOOP: for each optionId in param.options */
        }
      /* END LOOP: for each paramId in thisProduct.data.params */
      }
      /* multiply price be ammount */
      price *= thisProduct.amountWidget.value;
      /* set the contents of thisProduct.priceElem to be the value of variable price */
      thisProduct.priceElem.innerHTML = price;
    }

    initAmountWidget(){
      const thisProduct = this;

      thisProduct.amountWidget = new AmountWidget(thisProduct.amountWidgetElem);

      thisProduct.amountWidgetElem.addEventListener('updated', function(event){
        event.preventDefault();
        thisProduct.processOrder();
      });
    }
  }

  class AmountWidget{
    constructor(element){
      const thisWidget = this;

      thisWidget.getElements(element);
      thisWidget.setValue(thisWidget.input.value);
      thisWidget.initActions();

      console.log('AomuntWidget:', thisWidget);
      console.log('constructor arguments:', element);
    }

    getElements(element){
      const thisWidget = this;

      thisWidget.element = element;
      thisWidget.input = thisWidget.element.querySelector(select.widgets.amount.input);
      thisWidget.linkDecrease = thisWidget.element.querySelector(select.widgets.amount.linkDecrease);
      thisWidget.linkIncrease = thisWidget.element.querySelector(select.widgets.amount.linkIncrease);
    }
    setValue(value){
      const thisWidget = this;


      const newValue = parseInt(value);

      /* TODO: Add validation */

      thisWidget.value = newValue;
      thisWidget.announce();
      thisWidget.input.value = thisWidget.value;
    }

    initActions(){
      const thisWidget = this;
      console.log(thisWidget);

      thisWidget.input.addEventListener('change', function(event){
        event.preventDefault();
        thisWidget.setValue(thisWidget.input.value);
      });

      thisWidget.linkDecrease.addEventListener('click', function(event){
        event.preventDefault();
        thisWidget.setValue(thisWidget.value - 1)
      });

      thisWidget.linkIncrease.addEventListener('click', function(event){
        event.preventDefault();
        thisWidget.setValue(thisWidget.value + 1)
      });
    }

    announce(){
      const thisWidget = this;

      const event = new Event('updated');
      thisWidget.element.dispatchEvent(event);
    }
  }

  const app = {
    initMenu: function(){
      const thisApp = this;
      console.log('thisApp.data:', thisApp.data);

      for(let productData in thisApp.data.products){
        new Product(productData, thisApp.data.products[productData]);
      }
    },

    initData: function(){
      const thisApp = this;
      thisApp.data = dataSource;
    },

    init: function(){
      const thisApp = this;
      //for(let productData in thisApp.data.products){
      // new Product(productData, thisApp.data.products[productData]);

      console.log('*** App starting ***');
      console.log('thisApp:', thisApp);
      console.log('classNames:', classNames);
      console.log('settings:', settings);
      console.log('templates:', templates);

      thisApp.initData();
      thisApp.initMenu();
    },
  };

  app.init();
}
