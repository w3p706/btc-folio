# BTC-Folio

A simple web app to watch you btc portfolio in total btc and usd.

**This is an early, but working Prototype**

##Features

<dl>
  <dt>Spend</dt>
  <dd>watch an arbitrary amount of btc's (eg. the ones you have in your btc client.)</dd>

  <dt>Save</dt>
  <dd>watch Bitcoin addresses
      * if you receive donations
      * if you have paperwallets
      * ...</dd>

  <dt>Invest</dt>
  <dd>watch your portfolio and balance from btct.co with you api key</dd>
</dl>

every setting ist stored in the local browser storage (see settings, import/export for what data is stored.)
the data is pulled from http://api.bitcoincharts.com, http://blockchain.info/ and https://btct.co/

##Technologies
* node.js, express, jade
* angularjs

