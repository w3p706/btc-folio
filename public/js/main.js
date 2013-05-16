'use strict';




var BTC = function ($scope, $http, $timeout) {
	var addresses_raw, spendvalue;
	
	//init		
	$scope.market = {};
  $scope.market.loading = 0;

	$scope.spend = {};	
	$scope.spend.value = 0;
	
	$scope.save = {}; $scope.save.addresses = [];
  $scope.save.loading = 0;

	$scope.invest = {};
  $scope.invest.loading = 0;
	
	$scope.settings = {
		show: true
		, text: "hide settings"
	};
	
	if (spendvalue = localStorage.getItem('btc-portfolio.spend.value')) {
		
		try {
			if (!isNaN(parseFloat(spendvalue))) $scope.spend.value = parseFloat(spendvalue);
		} catch (e) {
			console.warn(e);
		}
	}
	
	if (addresses_raw = localStorage.getItem('btc-portfolio.save.addresses')) {
		try {
			$scope.save.addresses = JSON.parse(addresses_raw);
		} catch (e) {
			console.warn(e);
		}
	}
	
	$scope.invest.BtcTcApiKey = localStorage.getItem('btc-portfolio.invest.BtcTcApiKey');
	
	if ($scope.spend.value || $scope.invest.BtcTcApiKey || $scope.save.addresses.length) {
		$scope.settings = {
			show: false
			, text: "show settings"
		};
		
		var s = {};
		s.BTC = $scope.spend.value;
		s.Addresses = $scope.save.addresses;
		s.BtcTcApiKey = $scope.invest.BtcTcApiKey;
		$scope.jsonimport = JSON.stringify(s, null, 4);
	}

	
	//blockchain api
	var updateBlockchain = function($scope) {
    $timeout(function() { $scope.market.loading++; }, 300);
		$http.get('./blockchain_address?a=' + $scope.save.addresses.join('|') ).success(function(data) {
			$scope.market.bitcoindata = data;
			$scope.market.bitcoindata.info.symbol_local.conversion_back = 1 / $scope.market.bitcoindata.info.symbol_local.conversion * 100000000;
			$scope.save.blockadr = data.addresses;
			$scope.save.wallet = data.wallet;
      $scope.lastRefresh = new Date();
      $scope.market.loading--;
		});
	};
	updateBlockchain($scope);
	
	
	var updateWeighted = function($scope) {
    $timeout(function() { $scope.market.loading++; }, 300);
		$http.get('./bitcoincharts_weighted').success(function(data) {
			$scope.market.ticker = data;
      $scope.lastRefresh = new Date();
      $scope.market.loading--;
		});
	};
	updateWeighted($scope);
	

	//btctc api
	var getBtcTcPortfolio = function($scope) {
		if ($scope.invest.BtcTcApiKey) {
      $timeout(function() { $scope.invest.loading++; }, 300);
			$http.get('./btc_tc_act?key=' + $scope.invest.BtcTcApiKey).success(function(data) {
				$scope.invest.btctc = data;
	
				$scope.invest.btctc.balance.BTC = parseFloat($scope.invest.btctc.balance.BTC);
				$scope.invest.totalbtc = $scope.invest.btctc.balance.BTC;
	
				for ( var key in $scope.invest.btctc.securities) {
          $timeout(function() { $scope.invest.loading++; }, 300);

					//noinspection JSUnresolvedVariable
          $scope.invest.btctc.securities[key].quantity = parseInt($scope.invest.btctc.securities[key].quantity);
	
					$http.get('./btc_tc_ticker?t=' + key).success(function(data) {
						var d = $scope.invest.btctc.securities[data.ticker];
						d.market = data;
						d.market.bid = parseFloat(d.market.bid);
						d.total_value = d.market.bid * d.quantity;
						$scope.invest.totalbtc += d.total_value;

            $scope.lastRefresh = new Date();
            $scope.invest.loading--;
					});
				}
        $scope.invest.loading--;
			});
		}
	};
	getBtcTcPortfolio($scope);
	
	$scope.addSpendValue = function() {
		$scope.spend.value += parseFloat($scope.spend.ValueAdd);
		$scope.spend.ValueAdd = '';
		localStorage.setItem('btc-portfolio.spend.value', $scope.spend.value);
	};

	$scope.addAddress = function() {
		$scope.save.addresses.push($scope.save.BitCoinAddress);
		$scope.save.BitCoinAddress = '';
		localStorage.setItem('btc-portfolio.save.addresses', JSON.stringify($scope.save.addresses));
		updateBlockchain($scope);
	};
	
	$scope.removeAddress = function(adr) {
		$scope.save.addresses = $scope.save.addresses.filter(function(element) { return element !== adr; } );
		localStorage.setItem('btc-portfolio.save.addresses', JSON.stringify($scope.save.addresses));
		updateBlockchain($scope);
	};	

	$scope.addBtcTcApiKey = function() {
		$scope.invest.BtcTcApiKey = $scope.invest.BtcTcApiKey; //?
		localStorage.setItem('btc-portfolio.invest.BtcTcApiKey', $scope.invest.BtcTcApiKey);
		getBtcTcPortfolio($scope);
	};
	
	
	$scope.getUsd = function(value) {
		if (!$scope.market.bitcoindata) return undefined;
		return $scope.market.bitcoindata.info.symbol_local.conversion_back * value;
	};
	
	
	$scope.getTotal = function() {
		var tot = 0;
		tot += $scope.spend.value;
		
		if ($scope.save.wallet) tot += $scope.save.wallet.final_balance/100000000;
		if ($scope.invest.totalbtc) tot += $scope.invest.totalbtc;
		return tot;
	};
	
	$scope.refresh = function() {
		updateBlockchain($scope);
		getBtcTcPortfolio($scope);	
		updateWeighted($scope);
    if (ga) {
      ga('send', 'event', {
        'eventCategory': 'MainPage',
        'eventAction': 'Refresh'
      });
    }
	};
	
	$scope.toggleSettings = function() {
		$scope.settings.show = !$scope.settings.show;
		$scope.settings.text = $scope.settings.show ? "hide settings" : "show settings";
	};
	
	$scope.getMarketChange = function(key) {
		if (!$scope.market.bitcoindata) return null;
    if (!$scope.market.ticker) return null;
		return (($scope.market.bitcoindata.info.symbol_local.conversion_back - $scope.market.ticker.USD[key])/$scope.market.ticker.USD[key] * 100);	
	};

	
	$scope.getTickerChange = function(security, key) {
		if (!security.market) return null;
		return  ((security.market.bid - security.market[key])/security.market[key] * 100);
	};

	
	$scope.importSettings = function() {
		var data = JSON.parse($scope.jsonimport);
		
		if (!data) {
			alert('Error parsing Json');
			return;
		}

		if (data.BTC) {
      $scope.spend.value = parseFloat(data.BTC);
			localStorage.setItem('btc-portfolio.spend.value', $scope.spend.value);
		}
		
		if (data.Addresses) {
			$scope.save.addresses = data.Addresses;
			localStorage.setItem('btc-portfolio.save.addresses', JSON.stringify($scope.save.addresses));
			updateBlockchain($scope);
		}
		
		if (data.BtcTcApiKey) {
      $scope.invest.BtcTcApiKey = data.BtcTcApiKey;
			localStorage.setItem('btc-portfolio.invest.BtcTcApiKey', $scope.invest.BtcTcApiKey);
			getBtcTcPortfolio($scope);
		}

    $scope.toggleSettings();
	};

  var countUp = function() {
    $scope.refresh();
    $timeout(countUp, 1000 * 60 * 5);
  };

  $timeout(countUp, 1000 * 60 * 5);
};

BTC.$inject = ['$scope', '$http', '$timeout'];