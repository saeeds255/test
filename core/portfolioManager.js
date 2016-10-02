/*

  The portfolio manager is responsible for making sure that
  all decisions are turned into orders and make sure these orders
  get executed. Besides the orders the manager also keeps track of
  the client's portfolio.

*/

var _ = require('lodash');
var util = require('./util');
var events = require("events");
var log = require('./log');
var async = require('async');
var checker = require('./exchangeChecker.js');

var Manager = function(conf) {
  _.bindAll(this);

  var error = checker.cantTrade(conf);
  if(error)
    util.die(error);

  var exchangeMeta = checker.settings(conf);
  this.exchangeSlug = exchangeMeta.slug;

  // create an exchange
  var Exchange = require('../exchanges/' + this.exchangeSlug);
  this.exchange = new Exchange(conf);

  this.conf = conf;
  this.portfolio = {};
  this.fee;
  this.order;
  this.action;

  this.directExchange = exchangeMeta.direct;
  this.infinityOrderExchange = exchangeMeta.infinityOrder;

  this.marketConfig = _.find(exchangeMeta.markets, function(p) {
    return p.pair[0] === conf.currency && p.pair[1] === conf.asset;
  });
  this.minimalOrder = this.marketConfig.minimalOrder;

  this.currency = conf.currency;
  this.asset = conf.asset;
};

Manager.prototype.init = function(callback) {
  log.debug('getting balance & fee from', this.exchange.name);
  var prepare = function() {
    this.starting = false;

    log.info('trading at', this.exchange.name, 'ACTIVE');
    log.info(this.exchange.name, 'trading fee will be:', this.fee * 100 + '%');
    this.logPortfolio();

    callback();
  };

  async.series([
    this.setPortfolio,
    this.setFee
  ], _.bind(prepare, this));
}

Manager.prototype.setPortfolio = function(callback) {
  var set = function(err, portfolio) {
    if(err)
      util.die(err);

    this.portfolio = portfolio;

    if(_.isFunction(callback))
      callback();
  }.bind(this);

  this.exchange.getPortfolio(set);
};

Manager.prototype.setFee = function(callback) {
  var set = function(err, fee) {
    this.fee = fee;

    if(err)
      util.die(err);

    if(_.isFunction(callback))
      callback();
  }.bind(this);
  this.exchange.getFee(set);
};

Manager.prototype.setTicker = function(callback) {
  var set = function(err, ticker) {
    this.ticker = ticker;

    if(_.isFunction(callback))
      callback();
  }.bind(this);
  this.exchange.getTicker(set);
};

// return the [fund] based on the data we have in memory
Manager.prototype.getFund = function(fund) {
  return _.find(this.portfolio, function(f) { return f.name === fund});
};
Manager.prototype.getBalance = function(fund) {
  return this.getFund(fund).amount;
};

// This function makes sure order get to the exchange
// and initiates follow up to make sure the orders will
// get executed. This is the backbone of the portfolio
// manager.
//
// How this is done depends on a couple of things:
//
// is this a directExchange? (does it support MKT orders)
// is this a infinityOrderExchange (does it support order
// requests bigger then the current balance?)
Manager.prototype.trade = function(what) {
  var buyprice1, buyprice2, buyprice3, sellprice1, sellprice2, sellprice3;
  if(what !== 'BUY1' && what !== 'BUY2' && what !== 'BUY3' && what !== 'SELL1' && what !== 'SELL2' && what !== 'SELL3')
    return;

  this.action = what;

  var act = function() {
    var amount, buyprice1, buyprice2, buyprice3, sellprice1, sellprice2, sellprice3;
    buyprice1 = this.ticker.ask - 4;
    buyprice2 = this.ticker.ask - 8;
    buyprice3 = this.ticker.ask - 12;
    sellprice1 = buyprice1 + 4;
    sellprice2 = buyprice2 + 4;
    sellprice3 = buyprice3 + 4;
    if(what === 'BUY1') {

      // do we need to specify the amount we want to buy?
      if(this.infinityOrderExchange)
        amount = 10000;
      else
        //amount = this.getBalance(this.currency) / this.ticker.ask;
        amount = 0.01;

      // can we just create a MKT order?
      if(this.directExchange)
        buyprice1 = false;
      else
        buyprice1 = this.ticker.ask - 4;
      //*********************************************************************************************************
      //**********************************************
  buyprice1 *= 100000000;
  buyprice1 = Math.floor(buyprice1);
  buyprice1 /= 100000000;

  var currency = this.getFund(this.currency);
  var minimum = this.getMinimum(buyprice1);
  var available = this.getBalance(this.currency) / buyprice1;

  // if not sufficient funds
  if(amount > available) {
    return log.info(
      'Wanted to buy but insufficient',
      this.currency,
      '(' + available.toFixed(12) + ')',
      'at',
      this.exchange.name
    );
  }

  // if order to small
  if(amount < minimum) {
    return log.info(
      'Wanted to buy',
      this.asset,
      'but the amount is too small',
      '(' + amount.toFixed(12) + ')',
      'at',
      this.exchange.name
    );
  }

  log.info(
    'Attempting to BUY',
    amount,
    this.asset,
    'at',
    this.exchange.name
  );
      //**********************************************
      //*********************************************************************************************************
      //this.buy(amount, price);
      this.exchange.buy(amount, buyprice1, this.noteOrder1);

    }
    
    
    else if(what === 'BUY2') {

      // do we need to specify the amount we want to buy?
      if(this.infinityOrderExchange)
        amount = 10000;
      else
        //amount = this.getBalance(this.currency) / this.ticker.ask;
        amount = 0.01;

      // can we just create a MKT order?
      if(this.directExchange)
        buyprice2 = false;
      else
        buyprice2 = this.ticker.ask - 8;
      //*********************************************************************************************************
      //**********************************************
  buyprice2 *= 100000000;
  buyprice2 = Math.floor(buyprice2);
  buyprice2 /= 100000000;

  var currency = this.getFund(this.currency);
  var minimum = this.getMinimum(buyprice2);
  var available = this.getBalance(this.currency) / buyprice2;

  // if not sufficient funds
  if(amount > available) {
    return log.info(
      'Wanted to buy but insufficient',
      this.currency,
      '(' + available.toFixed(12) + ')',
      'at',
      this.exchange.name
    );
  }

  // if order to small
  if(amount < minimum) {
    return log.info(
      'Wanted to buy',
      this.asset,
      'but the amount is too small',
      '(' + amount.toFixed(12) + ')',
      'at',
      this.exchange.name
    );
  }

  log.info(
    'Attempting to BUY',
    amount,
    this.asset,
    'at',
    this.exchange.name
  );
      //**********************************************
      //*********************************************************************************************************
      //this.buy(amount, price);
      this.exchange.buy(amount, buyprice2, this.noteOrder2);

    }
    
    
    else if(what === 'BUY3') {

      // do we need to specify the amount we want to buy?
      if(this.infinityOrderExchange)
        amount = 10000;
      else
        //amount = this.getBalance(this.currency) / this.ticker.ask;
        amount = 0.01;

      // can we just create a MKT order?
      if(this.directExchange)
        buyprice3 = false;
      else
        buyprice3 = this.ticker.ask - 12;
      //*********************************************************************************************************
      //**********************************************
  buyprice3 *= 100000000;
  buyprice3 = Math.floor(buyprice3);
  buyprice3 /= 100000000;

  var currency = this.getFund(this.currency);
  var minimum = this.getMinimum(buyprice3);
  var available = this.getBalance(this.currency) / buyprice3;

  // if not sufficient funds
  if(amount > available) {
    return log.info(
      'Wanted to buy but insufficient',
      this.currency,
      '(' + available.toFixed(12) + ')',
      'at',
      this.exchange.name
    );
  }

  // if order to small
  if(amount < minimum) {
    return log.info(
      'Wanted to buy',
      this.asset,
      'but the amount is too small',
      '(' + amount.toFixed(12) + ')',
      'at',
      this.exchange.name
    );
  }

  log.info(
    'Attempting to BUY',
    amount,
    this.asset,
    'at',
    this.exchange.name
  );
      //**********************************************
      //*********************************************************************************************************
      //this.buy(amount, price);
      this.exchange.buy(amount, buyprice3, this.noteOrder3);

    }
    
    
    else if(what === 'SELL1') {

      // do we need to specify the amount we want to sell?
      if(this.infinityOrderExchange)
        amount = 10000;
      else
        //amount = this.getBalance(this.asset);
        amount = 0.01;

      // can we just create a MKT order?
      //if(this.directExchange)
      // price = false;
      //else
        //price = this.ticker.bid;
  sellprice1 *= 100000000;
  sellprice1 = Math.ceil(sellprice1);
  sellprice1 /= 100000000;

  var minimum = this.getMinimum(sellprice1);
  var availabe = this.getBalance(this.asset);

  // if not suficient funds
  if(amount > availabe) {
    return log.info(
      'Wanted to buy but insufficient',
      this.asset,
      '(' + availabe.toFixed(12) + ')',
      'at',
      this.exchange.name
    );
  }

  // if order to small
  if(amount < minimum) {
    return log.info(
      'Wanted to buy',
      this.currency,
      'but the amount is to small',
      '(' + amount.toFixed(12) + ')',
      'at',
      this.exchange.name
    );
  }

  log.info(
    'Attempting to SELL',
    amount,
    this.asset,
    'at',
    this.exchange.name
  );
  this.exchange.sell(amount, sellprice1, this.noteOrder4);
  };
    
    
    
    else if(what === 'SELL2') {

      // do we need to specify the amount we want to sell?
      if(this.infinityOrderExchange)
        amount = 10000;
      else
        //amount = this.getBalance(this.asset);
        amount = 0.01;

      // can we just create a MKT order?
      //if(this.directExchange)
      // price = false;
      //else
        //price = this.ticker.bid;
  sellprice2 *= 100000000;
  sellprice2 = Math.ceil(sellprice2);
  sellprice2 /= 100000000;

  var minimum = this.getMinimum(sellprice2);
  var availabe = this.getBalance(this.asset);

  // if not suficient funds
  if(amount > availabe) {
    return log.info(
      'Wanted to buy but insufficient',
      this.asset,
      '(' + availabe.toFixed(12) + ')',
      'at',
      this.exchange.name
    );
  }

  // if order to small
  if(amount < minimum) {
    return log.info(
      'Wanted to buy',
      this.currency,
      'but the amount is to small',
      '(' + amount.toFixed(12) + ')',
      'at',
      this.exchange.name
    );
  }

  log.info(
    'Attempting to SELL',
    amount,
    this.asset,
    'at',
    this.exchange.name
  );
  this.exchange.sell(amount, sellprice2, this.noteOrder5);
  };
    
    
    
    else if(what === 'SELL3') {

      // do we need to specify the amount we want to sell?
      if(this.infinityOrderExchange)
        amount = 10000;
      else
        //amount = this.getBalance(this.asset);
        amount = 0.01;

      // can we just create a MKT order?
      //if(this.directExchange)
      // price = false;
      //else
        //price = this.ticker.bid;
  sellprice3 *= 100000000;
  sellprice3 = Math.ceil(sellprice2);
  sellprice3 /= 100000000;

  var minimum = this.getMinimum(sellprice3);
  var availabe = this.getBalance(this.asset);

  // if not suficient funds
  if(amount > availabe) {
    return log.info(
      'Wanted to buy but insufficient',
      this.asset,
      '(' + availabe.toFixed(12) + ')',
      'at',
      this.exchange.name
    );
  }

  // if order to small
  if(amount < minimum) {
    return log.info(
      'Wanted to buy',
      this.currency,
      'but the amount is to small',
      '(' + amount.toFixed(12) + ')',
      'at',
      this.exchange.name
    );
  }

  log.info(
    'Attempting to SELL',
    amount,
    this.asset,
    'at',
    this.exchange.name
  );
  this.exchange.sell(amount, sellprice3, this.noteOrder6);
  };
    
    
    
  async.series([
    this.setTicker,
    this.setPortfolio
  ], _.bind(act, this));

};

Manager.prototype.getMinimum = function(price) {
  if(this.minimalOrder.unit === 'currency')
    return minimum = this.minimalOrder.amount / price;
  else
    return minimum = this.minimalOrder.amount;
};

// first do a quick check to see whether we can buy
// the asset, if so BUY and keep track of the order
// (amount is in asset quantity)
//*****************************************************************************************************************************
//***********************************************************
//Manager.prototype.buy = function(amount, price) {
  // sometimes cex.io specifies a price w/ > 8 decimals

  //this.exchange.buy(amount, price, this.noteOrder);
//};
//***********************************************************
//*****************************************************************************************************************************

// first do a quick check to see whether we can sell
// the asset, if so SELL and keep track of the order
// (amount is in asset quantity)
//Manager.prototype.sell = function(amount, price) {
  // sometimes cex.io specifies a price w/ > 8 decimals

//};

//*****************************************************************************************************************************
//***********************************************************
Manager.prototype.noteOrder1 = function(err, order1) {
  this.order1 = order1;
  // if after 1 minute the order is still there
  // we cancel and calculate & make a new one
  setTimeout(this.checkOrder, util.minToMs(1));
};
  Manager.prototype.noteOrder2 = function(err, order2) {
  this.order2 = order2;
  // if after 1 minute the order is still there
  // we cancel and calculate & make a new one
  setTimeout(this.checkOrder, util.minToMs(1));
};
  Manager.prototype.noteOrder3 = function(err, order3) {
  this.order3 = order3;
  // if after 1 minute the order is still there
  // we cancel and calculate & make a new one
  setTimeout(this.checkOrder, util.minToMs(1));
};
  Manager.prototype.noteOrder4 = function(err, order4) {
  this.order4 = order4;
  // if after 1 minute the order is still there
  // we cancel and calculate & make a new one
  setTimeout(this.checkOrder, util.minToMs(1));
};
  Manager.prototype.noteOrder5 = function(err, order5) {
  this.order5 = order5;
  // if after 1 minute the order is still there
  // we cancel and calculate & make a new one
  setTimeout(this.checkOrder, util.minToMs(1));
};
  Manager.prototype.noteOrder6 = function(err, order6) {
  this.order6 = order6;
  // if after 1 minute the order is still there
  // we cancel and calculate & make a new one
  setTimeout(this.checkOrder, util.minToMs(1));
};
//***********************************************************
//*****************************************************************************************************************************

// check whether the order got fully filled
// if it is not: cancel & instantiate a new order
Manager.prototype.checkOrder = function() {
  var finish = function(err, filled) {
    if(!filled) {
      log.info(this.action, 'order was not (fully) filled, cancelling and creating new order');
      this.exchange.cancelOrder(this.order);

      // Delay the trade, as cancel -> trade can trigger
      // an error on cex.io if they happen on the same
      // unix timestamp second (nonce will not increment).
      var self = this;
      setTimeout(function() { self.trade(self.action); }, 500);
      return;
    }

    log.info(this.action, 'was successfull');
  }

  this.exchange.checkOrder(this.order, _.bind(finish, this));
}

Manager.prototype.logPortfolio = function() {
  log.info(this.exchange.name, 'portfolio:');
  _.each(this.portfolio, function(fund) {
    log.info('\t', fund.name + ':', fund.amount.toFixed(12));
  });
};

module.exports = Manager;
