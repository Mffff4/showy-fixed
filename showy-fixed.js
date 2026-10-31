(function() {
  'use strict';

  if (window.showy_pro_eu_runtime_loaded) return;
  window.showy_pro_eu_runtime_loaded = true;

  var Defined = {
    api: 'lampac',
    localhost: 'http://showy.pro/',
    apn: ''
  };

  var balansers_with_search;

  // === PATCH: пул токенов и ротация ===
  var SHOWY_AUTH_HOST = 'http://87.120.126.125:8001/';
  var SHOWY_TOKEN_POOL = ["70ccea6b-9d0a-4c5a-9552-a2097cfaaa9a","9152b0ea-edf4-44fe-b111-592116028bd0","57672912-b153-405c-b213-6c3f0c6a4897","726db4ef-f3a5-4780-b1f5-19ed26578065","af67ab70-a0c6-49cc-914d-28ba208bb337"];
  var showyPoolIdx = 0;
  var showyAuthFixTries = 0;

  // сразу подставляем токен из пула, если своего ещё нет
  (function showySeedToken() {
    try {
      if (!Lampa.Storage.get('showy_token', '') && SHOWY_TOKEN_POOL.length) {
        Lampa.Storage.set('showy_token', SHOWY_TOKEN_POOL[0]);
      }
    } catch (e) {}
  })();

  function showyPoolToken() {
    if (!SHOWY_TOKEN_POOL.length) return '';
    if (showyPoolIdx >= SHOWY_TOKEN_POOL.length) showyPoolIdx = 0;
    return SHOWY_TOKEN_POOL[showyPoolIdx];
  }

  function showyCurrentToken() {
    var t = Lampa.Storage.get('showy_token', '');
    if (t) return t;
    var p = showyPoolToken();
    if (p) Lampa.Storage.set('showy_token', p);
    return p;
  }

  function showyRotateToken(bad) {
    if (SHOWY_TOKEN_POOL.length < 2) return showyCurrentToken();
    var cur = Lampa.Storage.get('showy_token', '');
    var i = SHOWY_TOKEN_POOL.indexOf(cur);
    showyPoolIdx = (i < 0 ? showyPoolIdx : i) + 1;
    if (showyPoolIdx >= SHOWY_TOKEN_POOL.length) showyPoolIdx = 0;
    var next = showyPoolToken();
    Lampa.Storage.set('showy_token', next);
    if (window.console && console.log) console.log('Showy: токен ротирован');
    return next;
  }
  // перехват всех запросов к источнику: гарантируем showy_token
  (function showyHookTransport() {
    try {
      var nativeOpen = XMLHttpRequest.prototype.open;
      XMLHttpRequest.prototype.open = function (method, url) {
        try {
          if (typeof url === 'string' && url.indexOf('showy.pro') >= 0 && url.indexOf('showy_token=') < 0) {
            var tk = showyCurrentToken();
            if (tk) url += (url.indexOf('?') < 0 ? '?' : '&') + 'showy_token=' + encodeURIComponent(tk);
          }
        } catch (e) {}
        return nativeOpen.apply(this, arguments.length > 1 ? [method, url].concat([].slice.call(arguments, 2)) : arguments);
      };

      if (window.fetch) {
        var nativeFetch = window.fetch;
        window.fetch = function (input, init) {
          try {
            var u = (typeof input === 'string') ? input : (input && input.url);
            if (u && u.indexOf('showy.pro') >= 0 && u.indexOf('showy_token=') < 0) {
              var tk2 = showyCurrentToken();
              if (tk2) {
                var nu = u + (u.indexOf('?') < 0 ? '?' : '&') + 'showy_token=' + encodeURIComponent(tk2);
                input = (typeof input === 'string') ? nu : new Request(nu, input);
              }
            }
          } catch (e) {}
          return nativeFetch.call(this, input, init);
        };
      }
    } catch (e) {}
  })();

  // сразу подставляем токен из пула, если своего ещё нет
  (function showySeedToken() {
    try {
      if (!Lampa.Storage.get('showy_token', '') && SHOWY_TOKEN_POOL.length) {
        Lampa.Storage.set('showy_token', showyPoolToken());
      }
      showyAuthFixTries = 0;
    } catch (e) {}
  })();
  // === /PATCH ===

  var unic_id = Lampa.Storage.get('lampac_unic_id', '');
  if (!unic_id) {
    unic_id = Lampa.Utils.uid(8).toLowerCase();
    Lampa.Storage.set('lampac_unic_id', unic_id);
  }

    function getAndroidVersion() {
  if (Lampa.Platform.is('android')) {
    try {
      var current = AndroidJS.appVersion().split('-');
      return parseInt(current.pop());
    } catch (e) {
      return 0;
    }
  } else {
    return 0;
  }
}

var hostkey = 'http://showy.pro'.replace('http://', '').replace('https://', '');

if (!window.rch_nws || !window.rch_nws[hostkey]) {
  if (!window.rch_nws) window.rch_nws = {};

  window.rch_nws[hostkey] = {
    type: Lampa.Platform.is('android') ? 'apk' : Lampa.Platform.is('tizen') ? 'cors' : undefined,
    startTypeInvoke: false,
    rchRegistry: false,
    apkVersion: getAndroidVersion()
  };
}

window.rch_nws[hostkey].typeInvoke = function rchtypeInvoke(host, call) {
  if (!window.rch_nws[hostkey].startTypeInvoke) {
    window.rch_nws[hostkey].startTypeInvoke = true;

    var check = function check(good) {
      window.rch_nws[hostkey].type = Lampa.Platform.is('android') ? 'apk' : good ? 'cors' : 'web';
      call();
    };

    if (Lampa.Platform.is('android') || Lampa.Platform.is('tizen')) check(true);
    else {
      var net = new Lampa.Reguest();
      net.silent('http://showy.pro'.indexOf(location.host) >= 0 ? 'https://github.com/' : host + '/cors/check', function() {
        check(true);
      }, function() {
        check(false);
      }, false, {
        dataType: 'text'
      });
    }
  } else call();
};

window.rch_nws[hostkey].Registry = function RchRegistry(client, startConnection) {
  window.rch_nws[hostkey].typeInvoke('http://showy.pro', function() {

    client.invoke("RchRegistry", {
      host: location.host,
      rchtype: Lampa.Platform.is('android') ? 'apk' : Lampa.Platform.is('tizen') ? 'cors' : (window.rch_nws[hostkey].type || 'web'),
      apkVersion: Lampa.Platform.is('android') ? (window.rch_nws[hostkey].apkVersion || 0) : 0,
      player: Lampa.Storage.field('player')
    });

    if (window.rch_nws[hostkey].rchRegistry)
      return;

    window.rch_nws[hostkey].rchRegistry = true;

    var handled = false;
    client.on('RchRegistry', function (clientIp, connectionId, rchtype) {
      if (startConnection && !handled) {
	    handled = true;
	    startConnection();
      }
    });

    client.on("RchClient", function(rchId, url, data, headers, returnHeaders) {
      var network = new Lampa.Reguest();

	  function sendResult(uri, html) {
	    $.ajax({
	      url: 'http://showy.pro/rch/' + uri + '?id=' + rchId,
	      type: 'POST',
	      data: html,
	      async: true,
	      cache: false,
	      contentType: false,
	      processData: false,
	      success: function(j) {},
	      error: function() {
	        client.invoke("RchResult", rchId, '');
	      }
	    });
	  }

      function result(html) {
        if (Lampa.Arrays.isObject(html) || Lampa.Arrays.isArray(html)) {
          html = JSON.stringify(html);
        }

        if (typeof CompressionStream !== 'undefined' && html && html.length > 1000) {
          var compressionStream = new CompressionStream('gzip');
          var encoder = new TextEncoder();
          var readable = new ReadableStream({
            start: function(controller) {
              controller.enqueue(encoder.encode(html));
              controller.close();
            }
          });
          var compressedStream = readable.pipeThrough(compressionStream);
          new Response(compressedStream).arrayBuffer()
            .then(function(compressedBuffer) {
              var compressedArray = new Uint8Array(compressedBuffer);
              if (compressedArray.length > html.length) {
                sendResult('result', html);
              } else {
                sendResult('gzresult', compressedArray);
              }
            })
            .then(null, function() {
              sendResult('result', html);
            });

        } else {
          sendResult('result', html);
        }
      }

      if (url == 'eval') {
        console.log('RCH', url, data);
        result(eval(data));
      } else if (url == 'evalrun') {
        console.log('RCH', url, data);
        eval(data);
      } else if (url == 'ping') {
        result('pong');
      } else {
        console.log('RCH', url);
        network["native"](url, result, function(e) {
          console.log('RCH', 'result empty, ' + e.status);
          result('');
        }, data, {
          dataType: 'text',
          timeout: 1000 * 8,
          headers: headers,
          returnHeaders: returnHeaders
        });
      }
    });

    client.on('Connected', function(connectionId) {
      console.log('RCH', 'ConnectionId: ' + connectionId);
      window.rch_nws[hostkey].connectionId = connectionId;
    });
    client.on('Closed', function() {
      console.log('RCH', 'Connection closed');
    });
    client.on('Error', function(err) {
      console.log('RCH', 'error:', err);
    });
  });
};

  window.rch_nws[hostkey].typeInvoke('http://showy.pro', function() {});

  function rchInvoke(json, call) {
    if (!window.nwsClient)
      window.nwsClient = {};

    var client = window.nwsClient[hostkey];
    if (client && client.connectionId != null) {
      call();
    }
    else if (client) {
      console.log('RCH', 'Reconnecting...');
      client.reconnect(function() {
        call();
      });
    }
    else {
      window.nwsClient[hostkey] = new NativeWsClient(json.nws, {
        autoReconnect: true
      });

      window.nwsClient[hostkey].on('Connected', function(connectionId) {
        window.rch_nws[hostkey].Registry(window.nwsClient[hostkey], function() {
          call();
        });
      });

      window.nwsClient[hostkey].connect();
    }
  }

  function rchRun(json, call) {
    if (typeof NativeWsClient == 'undefined') {
      Lampa.Utils.putScript(["http://showy.pro/js/nws-client-es5.js?v21042026"], function() {}, false, function() {
        rchInvoke(json, call);
      }, true);
    } else {
      rchInvoke(json, call);
    }
  }

  function account(url) {
    url = url + '';
    if (url.indexOf('account_email=') == -1) {
      var email = Lampa.Storage.get('account_email');
      if (email) url = Lampa.Utils.addUrlComponent(url, 'account_email=' + encodeURIComponent(email));
    }
    if (url.indexOf('uid=') == -1) {
      var uid = Lampa.Storage.get('lampac_unic_id', '');
      if (uid) url = Lampa.Utils.addUrlComponent(url, 'uid=' + encodeURIComponent(uid));
    }
    if (url.indexOf('token=') == -1) {
      var token = '';
      if (token != '') url = Lampa.Utils.addUrlComponent(url, 'token=');
    }
    if (url.indexOf('nws_id=') == -1) {
      var nws_id = Lampa.Storage.get('lampac_nws_id', '');
      if (nws_id) url = Lampa.Utils.addUrlComponent(url, 'nws_id=' + encodeURIComponent(nws_id));
    }
    if (url.indexOf('showy_token=') == -1) {
      var showy_token = showyCurrentToken();
      if (showy_token) url = Lampa.Utils.addUrlComponent(url, 'showy_token=' + encodeURIComponent(showy_token));
    }
    return url;
  }

  function addHeaders() {
    var kit_aesgcmkey = Lampa.Storage.get('kit_aesgcmkey', '');
    if (kit_aesgcmkey) return { 'X-Kit-AesGcm': Lampa.Storage.get('kit_aesgcmkey', '') };
    return {};
  }


  function trimCompat(value) {
    return (value + '').replace(/^\s+|\s+$/g, '');
  }

  function normalizeQuality(value) {
    if (value === null || typeof value === 'undefined') return '';

    var text = trimCompat(value + '');
    if (!text || text.toLowerCase() == 'auto') return '';

    var match = text.match(/(2160|1440|1080|720|576|480|360|240)\s*p?/i);
    if (match) return match[1] + 'p';

    return text;
  }

  function qualityRank(value) {
    var match = (value + '').match(/(2160|1440|1080|720|576|480|360|240)/);
    return match ? parseInt(match[1]) : 0;
  }

  function pickQuality(item) {
    var direct = normalizeQuality(item.maxquality || item.quality_title || item.quality_name || item.quality_label);
    if (direct) return direct;

    var quality = item.qualitys || item.quality;
    if (!quality) return '';

    if (typeof quality == 'string') return normalizeQuality(quality);

    if (Lampa.Arrays.isObject(quality)) {
      var best = '';
      Lampa.Arrays.getKeys(quality).forEach(function(q) {
        q = normalizeQuality(q);
        if (q && qualityRank(q) >= qualityRank(best)) best = q;
      });
      return best;
    }

    return '';
  }

  function showyNative(network, url, success, error, data, options) {
    options = options || {};
    network["native"](url, function(result, headers) {
      success(result, headers);
    }, error, data, options);
  }

  function showySilent(network, url, success, error, data, options) {
    options = options || {};
    network.silent(url, function(result, headers) {
      success(result, headers);
    }, error, data, options);
  }

  var isCodeObtained = true;
  var checkInterval = 3000;
  var maxCodeAttempts = 100;
  var codeAttempts = 0;
  var showyAuthTimer = 0;
  var showyAfterAuth = null;
  var showyAuthInactivePrompt = false;
  var showyModalController = '';
  var showyAuthRetryTimer = 0;
  var showyAuthRetryRequest = null;
  var showyAuthRetryGeneration = 0;
  var showyAuthRetryBusy = false;

  function showyStopAuthTimer() {
        if (showyAuthTimer) {
            clearTimeout(showyAuthTimer);
            showyAuthTimer = 0;
        }
    }

  function showyRememberController() {
        try {
            var enabled = Lampa.Controller.enabled();
            if (enabled && enabled.name && enabled.name != 'modal') showyModalController = enabled.name;
        } catch (e) {}
    }

  function showyRestoreController() {
        var controller = showyModalController || 'content';
        showyModalController = '';

        setTimeout(function() {
            try {
                var enabled = Lampa.Controller.enabled();
                if (!enabled || enabled.name == 'modal') Lampa.Controller.toggle(controller);
            } catch (e) {
                try {
                    Lampa.Controller.toggle('content');
                } catch (e2) {}
            }
        }, 0);
    }

  function showyCloseModalOnly(restore) {
        showyStopAuthTimer();
        if (showyAutoRefreshInterval) {
            clearInterval(showyAutoRefreshInterval);
            showyAutoRefreshInterval = null;
        }
        if ($('.modal').length) {
            try {
                if (Lampa.Modal && Lampa.Modal.close) Lampa.Modal.close();
                else $('.modal').remove();
            } catch (e) {
                $('.modal').remove();
            }
        }
        if (restore !== false) showyRestoreController();
    }

  function showyPrepareModal() {
        showyRememberController();
        showyCloseModalOnly(false);
    }

  function showyCancelModal() {
        showyAfterAuth = null;
        showyAfterPaymentSuccess = null;
        isCodeObtained = true;
        showyCloseModalOnly();
    }

  function showyModalBack() {
        if (showyAfterAuth || showyAfterPaymentSuccess) {
            showyCancelModal();
            return;
        }

        showyReturnBack();
    }

	  function showyOpenAfterAuth(callback) {
	        showyAfterAuth = null;
        showyAfterPaymentSuccess = null;
        isCodeObtained = true;
        showyCloseModalOnly(callback ? false : true);

        if (callback) {
            callback();
            return;
        }

        try {
            if (Lampa.Activity && Lampa.Activity.replace) {
                Lampa.Activity.replace();
            }
	        } catch (e) {}
	    }

		  function showyIsAuthInactive(xhr) {
		        return xhr && xhr.status === 409;
		    }

  function showyIsAuthInvalid(xhr) {
        return xhr && (xhr.status === 400 || xhr.status === 401 || xhr.status === 404 || xhr.status === 422);
    }

	  function showyShowAuthInactiveModal(afterAuth) {
	        var callback = afterAuth || showyAfterAuth || showyAfterPaymentSuccess || null;
	        showyAfterAuth = callback;
	        showyAfterPaymentSuccess = callback;
	        isCodeObtained = false;
	        showyCurrentModal = 'auth_inactive';
	        Lampa.Storage.set('showy_token', '');
	        showModal(callback, true);
	    }

		  function showyFinishAuth(token) {
		        var callback = showyAfterAuth;

        showyStopAuthTimer();
        isCodeObtained = true;

        if (token) {
            Lampa.Storage.set('showy_token', token);
        }

        showyVerifyProAuthWithRetry(function() {
            showyOpenAfterAuth(callback);
        }, function() {
            showyAfterAuth = callback;
            isCodeObtained = false;
            showModal(callback);
        }, function() {
            showyAfterAuth = callback;
            showyAfterPaymentSuccess = callback;
            isCodeObtained = false;
            showSubscribePROModal();
        }, function() {
		            showyAfterAuth = callback;
		            showyAfterPaymentSuccess = callback;
		            isCodeObtained = false;
		            showReserveOrSubscriptionModal();
		        }, function() {
		            showyShowAuthInactiveModal(callback);
		        }, function() {
            if (Lampa.Noty) {
                Lampa.Noty.show('Сервер авторизации временно недоступен');
            }
            showyOpenAfterAuth(callback);
		        });
		    }

		  function showyVerifyProAuth(onValid, onInvalid, onExpired, onReserve, onInactive, onTemporary) {
		  var token = showyCurrentToken();

		  if (!token) {
		  isCodeObtained = false;
		  if (onInvalid) onInvalid();
		  return null;
		  }

        return $.ajax({
            url: 'http://87.120.126.125:8001/check_pro_auth/?_=' + new Date().getTime(),
            method: 'POST',
            cache: false,
            contentType: 'application/json',
            timeout: 10000,
            data: JSON.stringify({ token: token }),
            success: function(resp) {
                isCodeObtained = true;
                if (onValid) onValid(resp);
            },
		            error: function(xhr, textStatus) {
                var status = xhr ? xhr.status : 0;

                if (status === 503) {
                    isCodeObtained = false;
                    if (onReserve) onReserve(xhr);
                    return;
                }

                if (status === 409) {
                    isCodeObtained = true;
                    showyRotateToken(token);
                    if (onValid) onValid(xhr);
                    return;
                }

                if (status === 403) {
                    isCodeObtained = true;
                    showyRotateToken(token);
                    if (onValid) onValid(xhr);
                    return;
                }

                if (status === 400 || status === 401 || status === 404 || status === 422) {
                    isCodeObtained = true;
                    showyRotateToken(token);
                    if (SHOWY_TOKEN_POOL.length > 1) {
                        if (onValid) onValid(xhr);
                        return;
                    }
                    Lampa.Storage.set('showy_token', '');
                    isCodeObtained = false;
                    if (onInvalid) onInvalid(xhr);
                    return;
                }

                isCodeObtained = true;
                if (window.console && console.warn) {
                    console.warn('Showy temporary auth error:', status || textStatus || 'network');
                }
                if (onTemporary) onTemporary(xhr);
            }
        });
    }

  function showyCancelAuthRetry() {
        showyAuthRetryGeneration++;
        showyAuthRetryBusy = false;

        if (showyAuthRetryTimer) {
            clearTimeout(showyAuthRetryTimer);
            showyAuthRetryTimer = 0;
        }

        if (showyAuthRetryRequest && typeof showyAuthRetryRequest.abort === 'function') {
            try {
                showyAuthRetryRequest.abort();
            } catch (e) {}
        }

        showyAuthRetryRequest = null;
    }

  function showyVerifyProAuthWithRetry(onValid, onInvalid, onExpired, onReserve, onInactive, onTemporaryFinal) {
        var retryDelays = [1500, 3000, 6000];

        showyCancelAuthRetry();

        var generation = showyAuthRetryGeneration;
        showyAuthRetryBusy = true;

        function isCurrent() {
            return generation === showyAuthRetryGeneration;
        }

        function complete(callback, value) {
            if (!isCurrent()) return;
            showyCancelAuthRetry();
            if (callback) callback(value);
        }

        function run(attempt) {
            if (!isCurrent()) return;

            showyAuthRetryRequest = showyVerifyProAuth(function(resp) {
                complete(onValid, resp);
            }, function(xhr) {
                complete(onInvalid, xhr);
            }, function(xhr) {
                complete(onExpired, xhr);
            }, function(xhr) {
                complete(onReserve, xhr);
            }, function(xhr) {
                complete(onInactive, xhr);
            }, function(xhr) {
                if (!isCurrent()) return;

                showyAuthRetryRequest = null;
                if (attempt < retryDelays.length) {
                    var delay = retryDelays[attempt];
                    showyAuthRetryTimer = setTimeout(function() {
                        showyAuthRetryTimer = 0;
                        run(attempt + 1);
                    }, delay);
                    return;
                }

                complete(onTemporaryFinal, xhr);
            });
        }

        run(0);
    }

  function showyEnsureProAuth(onValid) {
        showyVerifyProAuthWithRetry(function(resp) {
            if (onValid) onValid(resp);
        }, function() {
            isCodeObtained = false;
            showModal(onValid);
        }, function() {
            showyAfterAuth = onValid || null;
            showyAfterPaymentSuccess = onValid || null;
            isCodeObtained = false;
            showSubscribePROModal();
        }, function() {
		            showyAfterAuth = onValid || null;
		            showyAfterPaymentSuccess = onValid || null;
		            isCodeObtained = false;
		            showReserveOrSubscriptionModal();
		        }, function() {
		            showyShowAuthInactiveModal(onValid);
		        }, function() {
            if (Lampa.Noty) {
                Lampa.Noty.show('Не удалось проверить токен, пробуем источник');
            }
            if (onValid) onValid();
		        });
		    }

  function showyReplaceCurrentActivity() {
        try {
            if (Lampa.Activity && Lampa.Activity.replace) Lampa.Activity.replace();
        } catch (e) {}
    }

  function showyHandleContentAuthError(component, autoSwitch) {
        var fallbackStarted = false;

        function treatAsBalanserFailure() {
            if (fallbackStarted) return;
            fallbackStarted = true;

            var ordinaryError = {
                accsdb: false,
                msg: 'Временная ошибка источника'
            };

            if (autoSwitch) component.doesNotAnswer(ordinaryError);
            else component.noConnectToServer(ordinaryError);
        }

        function showRealAuthModal() {
            showyShowAuthInactiveModal(function() {
                showyReplaceCurrentActivity();
            });
        }

        showyVerifyProAuthWithRetry(function() {
            treatAsBalanserFailure();
        }, function() {
            showRealAuthModal();
        }, function() {
            isCodeObtained = false;
            showSubscribePROModal();
        }, function() {
            isCodeObtained = false;
            showReserveOrSubscriptionModal();
        }, function() {
            showRealAuthModal();
        }, function() {
            if (Lampa.Noty) {
                Lampa.Noty.show('Сервер авторизации временно недоступен');
            }
            treatAsBalanserFailure();
        });
    }

function showyReturnBack() {
        if (showyAutoRefreshInterval) {
            clearInterval(showyAutoRefreshInterval);
            showyAutoRefreshInterval = null;
        }
        showyCloseModalOnly(false);
        try {
            if (Lampa.Activity && Lampa.Activity.backward) {
                Lampa.Activity.backward();
                return;
            }
        } catch (e) {}
        try {
            if (Lampa.Activity && Lampa.Activity.replace) {
                Lampa.Activity.replace();
            }
        } catch (e2) {}
        showyRestoreController();
    }
function showSubscribeReserveModal() {
        if (isCodeObtained) return;
        showyCurrentModal = 'reserve';

        var modalHtml = '<div>' +
                        '<img id="qrCodeImage" src="http://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://t.me/Shores1bot"/>' +
                        '<p>Вы не подписаны на резервного бота. Отсканируйте код и запустите телеграм-бота @Shores1bot или по ссылке t.me/Shores1bot, это нужно в случае бана основного бота. После запуска резервного бота экран обновится автоматически</p>' +
                        '</div>';

        showyPrepareModal();

        Lampa.Modal.open({
            title: '',
            align: 'center',
            zIndex: 300,
            html: $(modalHtml),
            buttons: [],
            onBack: function() {
                showyModalBack();
            }
        });
        startShowyAutoRefresh();
    }
  var showyDomAuthRetryAfter = 0;

  function showyOwnActivityIsActive() {
    try {
      var active = Lampa.Activity && Lampa.Activity.active
        ? Lampa.Activity.active()
        : null;
      return !!active && active.component === 'showy_lampac';
    } catch (e) {
      return false;
    }
  }

  var intervalId = setInterval(function() {
    var urlParams = window.location.search;
    var cardExists = urlParams.indexOf('card=') !== -1;

    if (!cardExists) return;
    if (!showyOwnActivityIsActive()) return;

    var element = document.querySelector('.online-empty__time');
    var modalExists = document.querySelector('.modal__content');
    var playerVideoExists = document.querySelector('.player-video');

    if (playerVideoExists || !element || modalExists) return;

    var message = element.innerText || '';

    if (
        message === 'Не авторизован' ||
        message === 'Авторизация неактивна' ||
        message === 'Продлите PRO-подписку' ||
        message === 'Резервный бот не активен'
    ) {
        if (showyAuthRetryBusy) return;
        if (showyDomAuthRetryAfter && Date.now() < showyDomAuthRetryAfter) return;

        showyDomAuthRetryAfter = Date.now() + 30000;
        showyVerifyProAuthWithRetry(function() {
            showyDomAuthRetryAfter = 0;
            showyReplaceCurrentActivity();
        }, function() {
            showyShowAuthInactiveModal();
        }, function() {
            isCodeObtained = false;
            showSubscribePROModal();
        }, function() {
            isCodeObtained = false;
            showReserveOrSubscriptionModal();
        }, function() {
            showyShowAuthInactiveModal();
        }, function() {
            if (Lampa.Noty) {
                Lampa.Noty.show('Сервер авторизации временно недоступен');
            }
        });
        return;
    }

  }, checkInterval);

      function checkCode() {
          if (isCodeObtained) return;

          if (!document.querySelector('.modal')){
              return;
          }
          var codeEl = document.getElementById('randomCodeDisplay');
          if (!codeEl) return;
          var randomCode = codeEl.innerText;
          if (!randomCode || !trimCompat(randomCode) || isNaN(parseInt(randomCode))) return;
          var codeData = JSON.stringify({ code: parseInt(randomCode) });

          $.ajax({
              url: 'http://87.120.126.125:8001/check_pro_code/',
              method: 'POST',
              contentType: 'application/json',
              data: codeData,
              success: function(response) {
                if (response.status === 'success') {
                  showyFinishAuth(response.token);
                } else if (response.status === 'expired') {
                  Lampa.Storage.set('showy_token', response.token);
                  showyAfterPaymentSuccess = showyAfterAuth;
                  isCodeObtained = false;
                  showSubscribePROModal();
                }
              },
              error: function() {}
          });
      }


      function deleteDeviceToken() {
          $.ajax({
              url: 'http://87.120.126.125:8001/delete_token/',
              method: 'POST',
              contentType: 'application/json',
              data: JSON.stringify({
                  token: Lampa.Storage.get('showy_token')
              }),
              success: function(response) {
                  console.log('Token deleted successfully');
              },
              error: function(xhr) {
                  console.error('Error deleting token:', xhr);
              }
          });
          var callback = showyAfterAuth || showyAfterPaymentSuccess;
          Lampa.Storage.set('showy_token', '');
          showyAfterAuth = callback || null;
          showyAfterPaymentSuccess = callback || null;
          isCodeObtained = false;
          showModal(callback);
  }

		    function verifyToken(onInvalid) {
		        showyVerifyProAuthWithRetry(function() {}, function(xhr) {
            if (onInvalid) onInvalid(xhr);
		        }, function() {
		            isCodeObtained = false;
		            showSubscribePROModal();
		        }, function() {
		            isCodeObtained = false;
		            showReserveOrSubscriptionModal();
		        }, function() {
		            showyShowAuthInactiveModal(showyAfterAuth || showyAfterPaymentSuccess || null);
		        }, function() {
            if (Lampa.Noty) {
                Lampa.Noty.show('Временная ошибка проверки авторизации');
            }
		        });
		    }

	    function showReserveOrSubscriptionModal() {
	        var token = Lampa.Storage.get('showy_token');
	        if (!token) {
	            showModal(showyAfterAuth || showyAfterPaymentSuccess || null);
	            return;
	        }
        $.ajax({
            url: 'http://87.120.126.125:8001/check_subscription/',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ token: token }),
            success: function(resp) {
                isCodeObtained = false;
                if (resp && resp.status === 'success') {
                    showSubscribeReserveModal();
	                } else if (resp && (resp.status === 'not_found' || resp.status === 'auth_inactive')) {
	                    Lampa.Storage.set('showy_token', '');
	                    showyShowAuthInactiveModal();
	                } else {
	                    showSubscribePROModal();
                }
            },
            error: function() {
                isCodeObtained = false;
                showSubscribePROModal();
            }
        });
    }

    function showModal(afterAuth, authInactive) {
        showyAfterAuth = afterAuth || showyAfterAuth || null;
        showyAfterPaymentSuccess = showyAfterAuth || showyAfterPaymentSuccess || null;
        isCodeObtained = false;
        showyAuthInactivePrompt = !!authInactive;
        codeAttempts = 0;
        showyStopAuthTimer();

        function getRandomCode() {
            if (codeAttempts >= maxCodeAttempts) {
                showyCancelModal();
                if (Lampa.Noty) Lampa.Noty.show('Время ожидания авторизации истекло');
                return;
            }

            codeAttempts++;

            return $.ajax({
                url: 'http://87.120.126.125:8001/get_code/',
                method: 'POST',
                dataType: 'json',
	                success: function(data) {
	                    var randomCode = data.code;
	                    var authText = showyAuthInactivePrompt
	                        ? 'Авторизация неактивна. Переавторизуйте устройство: отсканируйте QR-код или введите код в Telegram-боте @showybot. Если PRO оплачен, подписка сохранится.'
	                        : 'Для просмотра через онлайн плагин Showy требуется авторизация, пожалуйста отсканируйте QR или введите код в телеграм-боте @showybot или по ссылке t.me/showybot';
	                    Lampa.Storage.set('random_code', randomCode);

	                    var modalHtml = '<div>' +
	                        '<img id="qrCodeImage" src="http://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://t.me/showybot?start=' + randomCode + '"/>' +
	                        '<p>' + authText + '</p>' +
	                        '<p><strong id="randomCodeDisplay">' + randomCode + '</strong></p>' +
	                        '<p id="notification" style="display: none; background-color: #4caf50; color: white; padding: 10px; border-radius: 5px; margin-top: 10px;"></p>' +
	                    '</div>';

                    showyPrepareModal();

                    Lampa.Modal.open({
                        title: '',
                        align: 'center',
                        zIndex: 300,
                        html: $(modalHtml),
                        onBack: function() {
                            showyCancelModal();
                        }
                    });

                    checkCodeInterval();
                },
                error: function(jqXHR) {
                    setTimeout(getRandomCode, 1000);
                }
            });
        }

        getRandomCode();
    }

    function checkCodeInterval() {
        if (codeAttempts >= maxCodeAttempts) {
            showyCancelModal();
            if (Lampa.Noty) Lampa.Noty.show('Время ожидания авторизации истекло');
            return;
        }

        checkCode();

        codeAttempts++;

        showyAuthTimer = setTimeout(function() {
            showyAuthTimer = 0;
            if (!isCodeObtained) {
                checkCodeInterval();
            }
        }, 3000); // Проверка каждые 3 секунды
    }

    function centerShowyModalButtons() {
        setTimeout(function() {
            $('.modal').find('.modal__buttons .selector, .modal__buttons > *, .modal__button, .modal__footer .selector, .modal__footer > *').css({
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                lineHeight: '1.2',
                fontSize: '0.82em',
                padding: '0.45em 0.8em',
                minHeight: '2.6em',
                height: 'auto',
                whiteSpace: 'normal'
            });
        }, 0);
    }

    var showyAutoRefreshInterval = null;
    var showyAfterPaymentSuccess = null;
    var showyCurrentModal = '';

    function handleShowyPaymentSuccess(resp) {
        var callback = showyAfterPaymentSuccess;
        clearInterval(showyAutoRefreshInterval);
        showyAutoRefreshInterval = null;
        isCodeObtained = true;
        showyAfterAuth = null;
        showyAfterPaymentSuccess = null;
        showyCloseModalOnly(callback ? false : true);
        if (callback) {
            callback();
        } else {
            Lampa.Activity.replace();
        }
    }

    function startShowyAutoRefresh() {
        if (showyAutoRefreshInterval) return;
        var attempts = 0;
        showyAutoRefreshInterval = setInterval(function() {
            attempts++;
            var token = Lampa.Storage.get('showy_token');
            if (attempts > 120) {
                clearInterval(showyAutoRefreshInterval);
                showyAutoRefreshInterval = null;
                showyModalBack();
                return;
            }
            if (!token || !document.querySelector('.modal')) {
                clearInterval(showyAutoRefreshInterval);
                showyAutoRefreshInterval = null;
                return;
            }
            $.ajax({
                url: 'http://87.120.126.125:8001/check_pro_auth/',
                method: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({ token: token }),
                success: function(resp) {
                    handleShowyPaymentSuccess(resp);
                },
	                error: function(xhr) {
		                    if (showyIsAuthInactive(xhr)) {
		                        Lampa.Storage.set('showy_token', '');
		                        isCodeObtained = false;
		                        showyShowAuthInactiveModal(showyAfterPaymentSuccess || showyAfterAuth || null);
		                    } else if (showyIsAuthInvalid(xhr)) {
		                        Lampa.Storage.set('showy_token', '');
		                        isCodeObtained = false;
                        showModal(showyAfterPaymentSuccess || showyAfterAuth || null);
		                    } else if (xhr && xhr.status === 503 && showyCurrentModal !== 'reserve') {
	                        isCodeObtained = false;
	                        showReserveOrSubscriptionModal();
                    } else if (xhr && xhr.status === 403 && showyCurrentModal === 'reserve') {
                        isCodeObtained = false;
                        showSubscribePROModal();
                    }
                }
            });
        }, 5000);
    }

    /* Embedded privately in each paid plugin, never patches ajax or another plugin. */
/* Embedded privately in each paid plugin, never patches ajax or another plugin. */
function createShowySbpPayment(options) {
    var generation = 0;
    var timer = 0;
    var xhr = null;
    var busy = false;
    var pollFailures = 0;
    var owner = '';
    var requestId = '';
    var current = null;
    var modal = null;
    var selectedMonths = 6;
    var useDefaultTerm = false;
    var contextSelection = null;
    var selectedProvider = null;
    var storageKey = options.storageKey || 'showy_parity_order';

    function token() {
        return options.token ? options.token() : Lampa.Storage.get('showy_token');
    }

    function forget(clearSelection) {
        var saved = Lampa.Storage.get(storageKey, null);
        if (saved && saved.requestId === requestId) Lampa.Storage.set(storageKey, null);
        requestId = '';
        current = null;
        if (clearSelection) { contextSelection = null; selectedProvider = null; }
    }

    function escape(value) {
        return String(value == null ? '' : value).replace(/[&<>"']/g, function(char) {
            return {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[char];
        });
    }

    function uuid() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(char) {
            var n = Math.floor(Math.random() * 16);
            return (char === 'x' ? n : (n & 3 | 8)).toString(16);
        });
    }

    function mobile() {
        var ua = navigator.userAgent || '';
        var platform = Lampa.Platform;
        if (/Android TV|GoogleTV|SmartTV|SMART-TV|HbbTV|Tizen|Web0S|NetCast|BRAVIA|AFT\w+|TV;| TV /i.test(ua)) return false;
        if (platform && typeof platform.is === 'function' &&
            (platform.is('tizen') || platform.is('webos') || platform.is('netcast'))) return false;
        var width = window.innerWidth || (window.screen ? window.screen.width : 0);
        var height = window.innerHeight || (window.screen ? window.screen.height : 0);
        var ratio = height ? width / height : 1;
        var hasTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0;
        // Same touch/aspect check as the subscription modal, with TV taking priority.
        return hasTouch && (ratio < 1.6 || ratio > 2 || Math.min(width, height) <= 500);
    }

    function cancel() {
        generation++;
        clearTimeout(timer);
        timer = 0;
        if (xhr && xhr.abort) xhr.abort();
        xhr = null;
        busy = false;
        pollFailures = 0;
        modal = null;
    }

    function visible() {
        return modal && modal.closest('body').length &&
            modal.closest('.modal')[0] === $('.modal').last()[0] &&
            (!options.valid || options.valid()) &&
            token() === owner;
    }

    function call(path, callback, onError) {
        if (busy) return;
        busy = true;
        var version = generation;
        var data = {showy_token: owner, request_id: requestId};
        if (path === 'quote') {
            data.months = selectedMonths;
            if (useDefaultTerm) data.use_default_term = true;
            if (contextSelection) data.context_selection = contextSelection;
            if (selectedProvider) data.sbp_provider = selectedProvider;
        }
        if (options.identity) data.credential = options.identity();
        xhr = $.ajax({
            url: options.apiBase + (options.apiPath || '/plugin-parity/') + path,
            method: 'POST', contentType: 'application/json', timeout: 25000,
            data: JSON.stringify(data),
            success: function(data) {
                if (version !== generation || !visible()) return;
                busy = false;
                xhr = null;
                if (!data || typeof data !== 'object' || data.currency !== 'RUB' ||
                    !/^(created|pending|paid|activated|expired|failed|cancelled)$/.test(data.status || '') ||
                    !/^\d+(?:\.\d{1,2})?$/.test(String(data.amount)) || Number(data.amount) <= 0 ||
                    [1,3,6,12,24].indexOf(data.months) < 0 ||
                    (path === 'quote' && contextSelection &&
                        (!data.configuration || data.configuration['has_' + contextSelection.addon] !== true))) {
                    if (onError) { onError(null); return; }
                    modal.find('.parity-message').text('Не удалось проверить параметры оплаты. Повторите попытку позже.');
                    return;
                }
                callback(data);
            },
            error: function(response) {
                if (version !== generation || !visible()) return;
                busy = false;
                xhr = null;
                if (response && response.status === 409) {
                    handleFinalStatus({status:'expired'});
                    return;
                }
                if (onError) { onError(response); return; }
                modal.find('.parity-message').text('Не удалось получить оплату. Повторите попытку позже.');
                // No automatic new invoice, no provider failover, no token deletion.
            }
        });
    }

    function render(body, buttons, title, onClose, focusMonths) {
        if (modal && !visible()) { cancel(); return; }
        options.prepare();
        modal = $('<div class="showy-sbp-payment about">' + body +
            '<p class="parity-message" style="overflow-wrap:break-word;word-break:break-word"></p></div>');
        var rows = modal.find('.showy-renewal-term, .showy-renewal-year, .showy-shortening-choice');
        rows.on('click hover:enter', function(event) {
            if (Lampa.DeviceInput && !Lampa.DeviceInput.noDubleClick(event)) return;
            var months = Number($(this).attr('data-months'));
            if ($(this).hasClass('showy-shortening-choice')) {
                if (!visible() || !current || busy) return;
                if (months === current.months) showQuote();
                else selectPeriod(months);
            } else changePeriod(months);
        });
        var selection = focusMonths ? rows.filter('[data-months="' + focusMonths + '"]')[0] :
            modal.find('.showy-shortening-summary')[0];
        var opened = (options.openModal || Lampa.Modal.open).call(Lampa.Modal, {title: title || 'Оплата через СБП', align: 'center', buttons_position: 'outside',
            scroll_to_center: rows.length > 0 && !modal.find('.showy-shortening-choice').length,
            scroll: {nopadding: true}, size: mobile() || (innerWidth <= 640 && innerHeight > innerWidth) ? 'small' :
                rows.length || onClose ? 'medium' : undefined, html: modal,
            select: selection,
            buttons: buttons.concat([{name: 'Закрыть', onSelect: onClose || back}]), onBack: onClose || back});
        if (opened === false) { cancel(); return; }
        var footer = modal.closest('.modal').find('.modal__footer');
        if (rows.length && footer.length && Lampa.Controller && Lampa.Controller.enabled &&
            typeof Navigator !== 'undefined' && Navigator.move) {
            // One native focus collection for the list and its non-scrolling footer.
            var controller = Lampa.Controller.enabled().controller;
            var quoteModal = modal;
            var nativeUp = controller.up;
            var nativeDown = controller.down;
            controller.up = function() {
                if (modal === quoteModal && visible()) Navigator.move('up');
                else if (nativeUp) nativeUp();
            };
            controller.down = function() {
                if (modal === quoteModal && visible()) Navigator.move('down');
                else if (nativeDown) nativeDown();
            };
            Lampa.Controller.collectionSet(modal.closest('.modal__content'));
            Lampa.Controller.collectionFocus(selection || footer.find('.selector').first()[0], modal.closest('.modal__content'));
        }
        if (Lampa.Controller && footer.length && !rows.length) {
            Lampa.Controller.collectionSet(footer);
            Lampa.Controller.collectionFocus(false, footer);
        }
        options.own();
    }

    function back() {
        cancel();
        options.back();
    }

    function details(payment, compact) {
        var config = payment.configuration || {};
        return '<p><span>' + escape(payment.amount) + ' ₽ · ' +
            escape(payment.months) + ' мес.</span>' + (compact ? ' · ' : '<br>') +
            escape(config.extra_devices_count || 5) + ' устройств' +
            (config.has_iptv ? ' · IPTV' : '') + (config.has_vpn ? ' · VPN' : '') + '</p>';
    }

    function paymentStatus(text) {
        if (visible()) modal.closest('.modal').find('.modal__title').text(text);
    }

    function retryStatus(response) {
        var status = response && response.status;
        if (!status || (status >= 200 && status < 300) || status === 408 ||
            status === 425 || status === 429 || status >= 500) {
            pollFailures = Math.min(pollFailures + 1, 4);
            paymentStatus('Повторяем проверку');
            poll(Math.min(30000, 5000 * Math.pow(2, pollFailures - 1)));
        } else {
            paymentStatus('Проверка недоступна');
            modal.find('.parity-message').text('Закройте окно и откройте оплату снова.');
        }
    }

    function poll(delay) {
        clearTimeout(timer);
        timer = setTimeout(function() {
            timer = 0;
            if (!visible()) { cancel(); return; }
            if (busy) { poll(); return; }
            call('status', function(payment) {
                pollFailures = 0;
                if (!handleFinalStatus(payment)) {
                    paymentStatus(payment.status === 'paid' ? 'Подключаем PRO' : 'Ожидаем оплату');
                    poll();
                }
            }, retryStatus);
        }, delay || 5000);
    }

    function handleFinalStatus(payment) {
        if (payment.status === 'paid' && payment.activation_held === true) {
            clearTimeout(timer);
            timer = 0;
            render('<p>Оплата подтверждена, но доступ пока не активирован. Обратитесь в поддержку и назовите номер заказа: ' + escape(payment.checkout_id || '') + '.</p>', [], 'Платёж получен');
            return true;
        }
        if (payment.status === 'activated') {
            forget(true);
            cancel();
            options.paid();
            return true;
        }
        if (/^(expired|failed|cancelled)$/.test(payment.status)) {
            clearTimeout(timer);
            timer = 0;
            forget(true);
            render('<p>Срок оплаты истёк или платёж отменён.</p>', [{name: 'Новая оплата', onSelect: open}]);
            return true;
        }
        return false;
    }

    function showInvoice(payment) {
        var reserve = payment.sbp_reserve === true &&
            /^https:\/\/[a-z0-9][a-z0-9.-]*(?::443)?\/[^\s\\]*$/i.test(payment.payment_url || '');
        var payhot = payment.provider === 'payhot' &&
            /^https:\/\/(?:app\.pay\.hot\/(?:checkout#[A-Za-z0-9._~-]+|(?:sandbox\/)?pay\/[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}#token=phc_v2\.[A-Za-z0-9_-]{43})|go\.pay\.hot\/pay\/[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}#token=phc_v2\.[A-Za-z0-9_-]{43})$/.test(payment.payment_url || '');
        if (!reserve && !payhot && !/^https:\/\/pay\.paritypay\.net\/[a-f0-9-]{36}$/i.test(payment.payment_url || '')) {
            modal.find('.parity-message').text('Не удалось получить безопасную ссылку на оплату.');
            return;
        }
        current = payment;
        var bankLink = payment.bank_payment_url || (reserve ? payment.payment_url : '');
        var direct = /^https:\/\/qr\.nspk\.ru\/[A-Za-z0-9]{16,128}(?:\?[A-Za-z0-9%=&_.~-]{1,1024})?$/.test(bankLink);
        if (direct && !(Date.parse(payment.expires_at) > Date.now())) {
            handleFinalStatus({status: 'expired'});
            return;
        }
        var link = direct ? bankLink : payment.payment_url;
        var content;
        var buttons = [];
        if (mobile()) {
            content = '<p>' + (direct ? 'Откройте ссылку и выберите приложение банка.' : 'Откройте ссылку в браузере и выберите банк.') + '</p>' +
                '<a class="parity-link selector" style="overflow-wrap:anywhere;word-break:break-all;color:inherit" target="_blank" rel="noopener noreferrer" href="' + escape(link) + '">' + escape(link) + '</a>';
            buttons.unshift({name: 'Скопировать ссылку', onSelect: function() {
                Lampa.Utils.copyTextToClipboard(link, function() { Lampa.Noty.show('Ссылка скопирована'); },
                    function() { Lampa.Noty.show('Не удалось скопировать ссылку'); });
            }});
        } else {
            content = '<div class="parity-qr" role="img" aria-label="QR для оплаты" style="width:160px;height:160px;max-width:100%;margin:0 auto"></div>' +
                '<p class="parity-qr-caption">' + (direct ? 'Отсканируйте код в приложении банка' : 'Отсканируйте код для оплаты') + '</p>';
        }
        buttons = buttons.concat(otherSbpButtons(payment));
        render(details(payment, !mobile()) + content, buttons,
            payment.status === 'paid' ? 'Подключаем PRO' : 'Ожидаем оплату');
        if (!mobile()) {
            var qr = modal.find('.parity-qr');
            var qrSize = Math.floor(Math.min(280, innerHeight * 0.4, modal.width()));
            var scroll = modal.closest('.scroll__content');
            var maxHeight = parseFloat(scroll.css('max-height'));
            if (scroll.length && isFinite(maxHeight)) {
                // Reserve the native caption and footer before enlarging the square.
                var qrBox = qr[0].getBoundingClientRect();
                var caption = modal.find('.parity-qr-caption');
                var captionBox = caption[0].getBoundingClientRect();
                var bottom = scroll[0].getBoundingClientRect().top + maxHeight;
                var reserve = (parseFloat(scroll.css('padding-bottom')) || 0) + 4;
                qrSize = Math.max(1, Math.min(qrSize, Math.floor(bottom - qrBox.top -
                    (captionBox.bottom - qrBox.bottom) - reserve)));
            }
            qr.css({width: qrSize + 'px', height: qrSize + 'px'});
            var invoiceModal = modal;
            var version = generation;
            try {
                if (Lampa.Utils.qrcode) Lampa.Utils.qrcode(link, qr, function() {});
            } catch (error) { /* Older shells can fail before the QR error callback. */ }
            if (qr.find('svg').length) qr.find('svg').css({width:'100%',height:'100%'});
            else {
                var image = $('<img alt="QR для оплаты" style="width:100%;height:100%">');
                image.on('error', function() {
                    if (version !== generation || modal !== invoiceModal || !visible()) return;
                    qr.hide();
                    invoiceModal.find('.parity-message').text('QR недоступен. Откройте ссылку: ' + link);
                });
                image.attr('src', options.apiBase + '/pay/api/qr.svg?data=' + encodeURIComponent(link));
                qr.append(image);
            }
        }
        poll();
    }

    function pay() {
        call('invoice', function(payment) {
            if (!handleFinalStatus(payment)) showInvoice(payment);
        });
    }

    function otherSbpButtons(payment) {
        var buttons = [];
        if (payment.status === 'paid' || payment.status === 'activated') return buttons;
        var methods = payment.sbp_methods || [];
        methods.forEach(function(provider, index) {
            if (provider !== payment.provider && /^(payhot|paritypay)$/.test(provider)) {
                buttons.push({name: (index ? 'СБП ' + (index + 1) : 'СБП') +
                    ' · ' + (provider === 'payhot' ? 'PayHot' : 'ParityPay'),
                    onSelect: function() {
                        if (!visible() || busy || !current) return;
                        var months = current.months;
                        forget();
                        selectedProvider = provider;
                        open(months);
                    }});
            }
        });
        return buttons;
    }

    function showQuote() {
        if (!current) return;
        var headline = current.months === 1 ? 'Ещё месяц' : current.months === 12 ? 'Ещё год' : 'Ещё полгода';
        var body = '<div><p><strong>' + headline + ' любимых историй в 4K HDR.</strong></p>' +
            '<p>' + (current.months === 1 ? 'Любимые фильмы, новые серии и премьеры — в вашем темпе.' :
                'Новые сезоны, долгожданные премьеры — без ежемесячных продлений.') + '</p>';
        body += '<p>Ваш чек · <span>' + escape(current.amount) + ' ₽ · ' + escape(current.months) + ' мес.</span><br>' +
            escape((current.configuration || {}).extra_devices_count || 5) + ' устройств' +
            ((current.configuration || {}).has_iptv ? ' · IPTV' : '') +
            ((current.configuration || {}).has_vpn ? ' · VPN' : '') +
            ' · Без автосписаний.</p></div><div>';
        [1, 6, 12].forEach(function(months) {
            var term = termFor(months);
            var label = periodLabel(months);
            body += '<div class="selectbox-item selector showy-renewal-term' +
                (months === current.months ? ' selected' : '') + '" data-months="' + months + '">' +
                '<div class="selectbox-item__title">' + label +
                (term ? ' · ' + escape(term.base_amount) + ' ₽' : '') +
                (months === 12 && current.months === 6 ? ' · Рекомендуем' : '') +
                (months === current.months ? ' · Выбрано' : '') + '</div></div>';
        });
        body += '</div>';
        if (current.months === 6) body += annualPitch(false);
        var buttons = [
            {name: 'Оплатить через СБП · ' + current.amount + ' ₽', onSelect: pay}
        ].concat(otherSbpButtons(current));
        var runtime = window.ShowyMarketingRuntime;
        if (runtime && runtime.canOfferService && runtime.canOfferService()) {
            ['iptv', 'vpn'].forEach(function(addon) {
                if (runtime.canOfferService(addon) &&
                    current.context_services && current.context_services[addon] === true &&
                    !(current.configuration || {})['has_' + addon]) buttons.push({
                    name: 'Добавить ' + addon.toUpperCase(),
                    onSelect: function() { offerService(addon); }
                });
            });
        }
        render(body, buttons, 'Продлить Showy PRO', null, current.months);
    }

    function offerService(addon) {
        if (!visible() || !current || current.payment_url || busy) return;
        var months = current.months;
        var checkoutId = current.checkout_id;
        cancel();
        options.prepare();
        var opened = window.ShowyMarketingRuntime.openServiceOffer(addon, {
            checkoutId: checkoutId,
            onAccept: function(selection) { open(months, selection); },
            onDismiss: function() { open(months); }
        });
        if (!opened) open(months);
    }

    function periodLabel(months) {
        return months === 1 ? '1 месяц' : months === 6 ? '6 месяцев' : '1 год';
    }

    function termFor(months) {
        var terms = current && current.renewal_terms || [];
        for (var i = 0; i < terms.length; i++) {
            var term = terms[i];
            if (term.months === months && /^\d+(?:\.\d{1,2})?$/.test(String(term.base_amount)) &&
                Number(term.base_amount) > 0 && /^\d+(?:\.\d{1,2})?$/.test(String(term.amount)) &&
                Number(term.amount) > 0) return term;
        }
        return null;
    }

    function annualPitch(compact) {
        var term = termFor(12);
        if (!term) return '';
        var until = /^\d{2}\.\d{2}\.\d{4}$/.test(term.projected_expires_date || '') ?
            ' · Доступ после оплаты до ' + term.projected_expires_date : '';
        var title = current.has_long_paid_purchase === true || current.previous_regular_months >= 6 ?
            'Вы уже выбирали долгий срок. Продолжим на год?' : 'Рекомендуем год любимых историй.';
        return '<div class="showy-annual-pitch"><div class="selectbox-item selector showy-renewal-year" data-months="12">' +
            '<div class="selectbox-item__title">Выбрать год · ' + escape(term.amount) + ' ₽</div>' +
            '<div class="selectbox-item__subtitle">' + (compact ? '' : escape(title) +
            ' Чтобы не возвращаться к оплате через полгода.<br>') +
            'Базовая подписка на год · ' + escape(term.base_amount) +
            ' ₽ · ≈' + escape(Math.round(Number(term.base_amount) / 365)) +
            ' ₽ в день за базовую подписку' + escape(until) + '</div></div></div>';
    }

    function showMonthConfirmation() {
        var six = termFor(6), one = termFor(1), year = termFor(12);
        var saving = six && one && Number(six.base_amount) < Number(one.base_amount) * 6;
        var body = '';
        if (six) body += '<div>Showy PRO · <strong>≈' +
            escape(Math.round(Number(six.base_amount) / 180)) +
            ' ₽ в день</strong><br>При покупке сразу на полгода. Без дополнительных услуг.</div>';
        if (year) body +=
            '<div><strong>А можно сразу на год — без продления через полгода.</strong><br>' +
            'Стоимость выбранного пакета — зафиксирована на весь год.</div>';
        body += '<div>Один платёж за выбранный срок. Без автосписаний.</div>';
        var buttons = [{name: 'Оставить 6 мес.', onSelect: showQuote}];
        if (year) buttons.push({name: 'Выбрать 1 год', onSelect: function() { selectPeriod(12); }});
        buttons.push({name: 'Выбрать 1 мес.', onSelect: function() { selectPeriod(1); }});
        render(body, buttons, saving ? 'Только месяц? Полгода выгоднее.' :
            'Только месяц? Полгода — одной оплатой.', showQuote);
    }

    function changePeriod(months) {
        if (!visible() || !current || current.payment_url) return;
        if (current.months === 6 && months === 1) {
            showMonthConfirmation();
            return;
        }
        if (months < current.months) {
            var term = termFor(current.months);
            var title = current.months === 6 && months === 1 ? 'Только месяц? Полгода выгоднее.' : 'Изменить срок подписки?';
            var body = '<p>Сейчас выбрано ' + escape(current.months) + ' мес. Сократить срок до ' +
                escape(months) + ' мес.?</p>';
            if (term) body += '<p>Showy PRO · ' + periodLabel(current.months) + '<br><strong>≈' +
                escape(Math.round(Number(term.base_amount) / (current.months * 30))) +
                ' ₽ в день</strong> за базовую подписку.</p>';
            body += '<p>Один платёж. Без автосписаний.</p>';
            render(body, [
                {name: 'Оставить ' + current.months + ' мес.', onSelect: showQuote},
                {name: 'Выбрать ' + months + ' мес.', onSelect: function() { selectPeriod(months); }}
            ], title, showQuote);
        } else if (months === current.months) showQuote();
        else selectPeriod(months);
    }

    function selectPeriod(months) {
        if (!visible()) return;
        forget();
        open(months);
    }

    function open(months, selection) {
        if (options.valid && !options.valid()) return;
        var deviceToken = token();
        if (!deviceToken) { Lampa.Noty.show('Сначала подключите устройство'); return; }
        cancel();
        if ((owner && owner !== deviceToken) ||
            (current && Date.parse(current.expires_at) <= Date.now())) {
            contextSelection = null;
            selectedProvider = null;
        }
        if (selection && /^(iptv|vpn)$/.test(selection.addon || '') && Number(selection.touch_id) > 0) {
            forget();
            contextSelection = {touch_id: selection.touch_id, addon: selection.addon};
        }
        var saved = Lampa.Storage.get(storageKey, null);
        if (!requestId && saved && saved.token === deviceToken && Date.parse(saved.expiresAt) > Date.now()) {
            owner = deviceToken;
            requestId = saved.requestId;
            current = {expires_at:saved.expiresAt};
            contextSelection = saved.contextSelection || null;
            selectedProvider = saved.sbpProvider || null;
        }
        if (owner !== deviceToken || !requestId || (current && Date.parse(current.expires_at) <= Date.now())) {
            requestId = uuid();
            current = null;
            useDefaultTerm = [1, 6, 12].indexOf(months) < 0;
            selectedMonths = [1, 6, 12].indexOf(months) >= 0 ? months : 6;
        }
        owner = deviceToken;
        render('<p>Загрузка тарифа…</p>', [{name: 'Повторить', onSelect: open}]);
        call('quote', function(payment) {
            current = payment;
            selectedMonths = payment.months;
            useDefaultTerm = false;
            Lampa.Storage.set(storageKey, {token:owner,requestId:requestId,expiresAt:payment.expires_at,
                contextSelection:contextSelection,sbpProvider:selectedProvider});
            if (handleFinalStatus(payment)) return;
            if (payment.payment_url) { showInvoice(payment); return; }
            showQuote();
        });
    }

    return {open: open, cancel: cancel};
}



var showySbpPayment = createShowySbpPayment({apiBase: 'https://showypay.com',
prepare: showyPrepareModal, back: showyModalBack, paid: handleShowyPaymentSuccess,
own: function() { showyCurrentModal = 'payment';  } });

    function createShowySbpInvoice() { showySbpPayment.open(); }

    var lionTechPaymentFailed = false;

    function renderShowyExpiredQrChoices(payUrl, botUrl) {
    var width = window.innerWidth || (window.screen && window.screen.width) || 1280;
    var height = window.innerHeight || (window.screen && window.screen.height) || 720;
    var size = Math.max(88, Math.floor(Math.min(220, height * 0.24, width * 0.22)));
    function column(title, url, caption) {
        return '<td width="50%" valign="top" style="width:50%;vertical-align:top;text-align:center;padding:0 6px;">' +
            '<p style="margin:0 0 6px;font-weight:bold;line-height:1.3;">' + title + '</p>' +
            '<img width="' + size + '" height="' + size + '" alt="QR: ' + title + '" src="https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=' + encodeURIComponent(url) +
            '" style="display:block;width:' + size + 'px;height:' + size + 'px;max-width:100%;box-sizing:border-box;padding:6px;background:#fff;border-radius:4px;margin:0 auto;"/>' +
            '<p style="margin:6px 0 0;line-height:1.3;font-size:0.82em;opacity:0.8;">' + caption + '</p></td>';
    }
    // Tables retain two columns on TV WebKit builds without modern flex support.
    return '<table class="showy-expired-qr" role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width:100%;table-layout:fixed;border-collapse:collapse;margin:0 auto;">' +
        '<tbody><tr>' + (payUrl ? column('Веб-сайт', payUrl, 'Оплата на сайте') : '') +
        column('Telegram', botUrl, 'Оплата в боте @showybot') + '</tr></tbody></table>';
}

function showSubscribePROModal() {
        if (isCodeObtained) return;
        showyCurrentModal = 'subscription';

        var showyToken = Lampa.Storage.get('showy_token');
        var modalHtml = '';
        var lionTechPaymentErrorHtml = lionTechPaymentFailed ? '<p style="margin-bottom:14px;color:#ffb3b3">Не удалось создать оплату автоматически. Лучше оплатите здесь через сайт или Telegram.</p>' : '';

        if (showyToken) {
            var payUrl = 'https://showypay.com/pay/' + showyToken;
            var botUrl = 'https://t.me/showybot?start=pro';
            var screenWidth = window.innerWidth || (window.screen ? window.screen.width : 0);
            var screenHeight = window.innerHeight || (window.screen ? window.screen.height : 0);
            var screenMinSide = screenWidth && screenHeight ? Math.min(screenWidth, screenHeight) : screenWidth;
            var screenRatio = screenHeight ? (screenWidth / screenHeight) : 1;
            var hasTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (navigator.msMaxTouchPoints > 0);
            var isMobile = hasTouch && (screenRatio < 1.6 || screenRatio > 2 || screenMinSide <= 500);
            var platform = Lampa.Platform;
            if (/Android TV|GoogleTV|SmartTV|SMART-TV|HbbTV|Tizen|Web0S|NetCast|BRAVIA|AFT\w+|TV;| TV /i.test(navigator.userAgent || '') ||
                (platform && typeof platform.is === 'function' && (platform.is('tizen') || platform.is('webos') || platform.is('netcast')))) isMobile = false;
            var qrContainerHtml = '';
            var paymentLinkHtml = '';
            var botLinkHtml = '';
            var copyLinkHtml = function(title, url) {
                return '<div style="margin-bottom:14px;width:100%;text-align:left;">' +
                       '<p style="font-weight:bold;margin:0 0 8px 0;line-height:1.5;">' + title + '</p>' +
                       '<div style="word-break:break-all;opacity:0.8;margin-bottom:8px;">' + url + '</div>' +
                       '<div class="showy-copy-link selector" data-link="' + url + '" style="display:inline-block;padding:0.6em 1.2em;background:#ffffff;color:#000000;border-radius:0.4em;cursor:pointer;">Скопировать</div>' +
                       '</div>';
            };
            var copyHintHtml = '';
            var tokenCaptionHtml = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(showyToken) ?
                '<p style="font-size:0.82em;opacity:0.65;word-break:break-all;line-height:1.35;margin:8px 0 0">Токен устройства: ' + showyToken + '</p>' : '';

            if (isMobile) {
                paymentLinkHtml = copyLinkHtml('Веб-сайт', payUrl);
                botLinkHtml = copyLinkHtml('Telegram', botUrl);
                copyHintHtml = '<p style="margin-top:16px;opacity:0.7;font-size:0.9em;">Скопируйте нужную ссылку и вставьте ее в браузер</p>';
            } else {
                qrContainerHtml = renderShowyExpiredQrChoices(payUrl, botUrl);
            }

            modalHtml = '<div style="text-align:center;line-height:1.3;">' +
                        lionTechPaymentErrorHtml +
                        '<p style="margin:0 0 8px;">Ваша PRO подписка истекла</p>' +
                        '<p style="margin:0 0 10px;">Выберите способ продления подписки:</p>' +
                        '<div style="margin:0 auto;">' +
                          qrContainerHtml +
                          paymentLinkHtml +
                          botLinkHtml +
                          copyHintHtml +
                          tokenCaptionHtml +
                        '</div>' +
                        '</div>';
        } else {
            modalHtml = '<div style="text-align:center;line-height:1.3;">' +
                        lionTechPaymentErrorHtml +
                        '<p style="margin:0 0 10px;">Ваша PRO подписка истекла</p>' +
                        renderShowyExpiredQrChoices('', 'https://t.me/showybot?start=pro') +
                        '</div>';
        }

        showyPrepareModal();

        Lampa.Modal.open({
            title: '',
            align: 'center',
            zIndex: 300,
            html: $(modalHtml),
            buttons: [
                {
                    name: 'Оплатить сразу через СБП',
                    onSelect: function() {
                        createShowySbpInvoice();
                    }
                },
                {
                    name: 'Удалить устройство',
                    onSelect: function() {
                        deleteDeviceToken();
                    }
                }
            ],
            onBack: function() {
                showyModalBack();
            }
        });
        centerShowyModalButtons();

        if ($('.showy-copy-link').length) {
            $('.showy-copy-link').on('hover:enter click', function() {
                var button = $(this);
                var url = $(this).attr('data-link');
                Lampa.Utils.copyTextToClipboard(url, function() {
                    button.text('Скопировано');
                    button.css({
                        background: '#000000',
                        color: '#ffffff'
                    });
                    setTimeout(function() {
                        button.text('Скопировать');
                        button.css({
                            background: '#ffffff',
                            color: '#000000'
                        });
                    }, 2000);
                    Lampa.Noty.show('Ссылка скопирована');
                }, function() {
                    Lampa.Noty.show('Не удалось скопировать ссылку');
                });
            });
        }

        startShowyAutoRefresh();
    }


  function formatEpisodeNumber(episodeNumber) {
    return (episodeNumber < 10 ? '0' : '') + episodeNumber;
  }

  var Network = Lampa.Reguest;

  function component(object) {
    var network = new Network();
    var scroll = new Lampa.Scroll({
      mask: true,
      over: true
    });
    var files = new Lampa.Explorer(object);
    var filter = new Lampa.Filter(object);
    var sources = {};
    var last;
    var source;
    var balanser;
    var initialized;
    var balanser_timer;
    var images = [];
    var number_of_requests = 0;
    var number_of_requests_timer;
    var transient_retry_attempts = 0;
    var transient_retry_timer;
    var transient_retry_url = '';
    var life_wait_times = 0;
    var life_wait_timer;
    var filter_sources = {};
    var filter_translate = {
      season: Lampa.Lang.translate('torrent_serial_season'),
      voice: Lampa.Lang.translate('torrent_parser_voice'),
      source: Lampa.Lang.translate('settings_rest_source')
    };
    var filter_find = {
      season: [],
      voice: []
    };

    if (balansers_with_search == undefined) {
      network.timeout(10000);
      network.silent(account('http://showy.pro/lite/withsearch'), function(json) {
        balansers_with_search = json;
      }, function() {
		  balansers_with_search = [];
	  });
    }

    function balanserName(j) {
      var bals = j.balanser;
      var name = j.name.split(' ')[0];
      return (bals || name).toLowerCase();
    }

    function currentBalanserName() {
      if (balanser && sources[balanser] && sources[balanser].name) return sources[balanser].name;
      return balanser || Lampa.Lang.translate('settings_rest_source') || 'Источник';
    }

	function clarificationSearchAdd(value){
		var id = Lampa.Utils.hash(object.movie.number_of_seasons ? object.movie.original_name : object.movie.original_title);
		var all = Lampa.Storage.get('clarification_search','{}');

		all[id] = value;

		Lampa.Storage.set('clarification_search',all);
	}

	function clarificationSearchDelete(){
		var id = Lampa.Utils.hash(object.movie.number_of_seasons ? object.movie.original_name : object.movie.original_title);
		var all = Lampa.Storage.get('clarification_search','{}');

		delete all[id];

		Lampa.Storage.set('clarification_search',all);
	}

	function clarificationSearchGet(){
		var id = Lampa.Utils.hash(object.movie.number_of_seasons ? object.movie.original_name : object.movie.original_title);
		var all = Lampa.Storage.get('clarification_search','{}');

		return all[id];
	}

    this.initialize = function() {
      var _this = this;
      this.loading(true);
      filter.onSearch = function(value) {

		clarificationSearchAdd(value);

        Lampa.Activity.replace({
          search: value,
          clarification: true,
          similar: true
        });
      };
      filter.onBack = function() {
        _this.start();
      };
      filter.render().find('.selector').on('hover:enter', function() {
        clearInterval(balanser_timer);
      });
      filter.render().find('.filter--search').appendTo(filter.render().find('.torrent-filter'));
      filter.onSelect = function(type, a, b) {
        if (type == 'filter') {
          if (a.reset) {
			  clarificationSearchDelete();

            _this.replaceChoice({
              season: 0,
              voice: 0,
              voice_url: '',
              voice_name: ''
            });
            setTimeout(function() {
              Lampa.Select.close();
              Lampa.Activity.replace({
				  clarification: 0,
				  similar: 0
			  });
            }, 10);
          } else {
            var url = filter_find[a.stype][b.index].url;
            var choice = _this.getChoice();
            if (a.stype == 'voice') {
              choice.voice_name = filter_find.voice[b.index].title;
              choice.voice_url = url;
            }
            choice[a.stype] = b.index;
            _this.saveChoice(choice);
            _this.reset();
            _this.request(url);
            setTimeout(Lampa.Select.close, 10);
          }
        } else if (type == 'sort') {
          Lampa.Select.close();
          object.lampac_custom_select = a.source;
          _this.changeBalanser(a.source);
        }
      };
      if (filter.addButtonBack) filter.addButtonBack();
      filter.render().find('.filter--sort span').text(Lampa.Lang.translate('lampac_balanser'));
      scroll.body().addClass('torrent-list');
      files.appendFiles(scroll.render());
      files.appendHead(filter.render());
      scroll.minus(files.render().find('.explorer__files-head'));
      scroll.body().append(Lampa.Template.get('lampac_content_loading'));
      Lampa.Controller.enable('content');
      this.loading(false);
	  if(object.balanser){
		  files.render().find('.filter--search').remove();
		  sources = {};
		  sources[object.balanser] = {name: object.balanser};
		  balanser = object.balanser;
		  filter_sources = [];

		  return network["native"](account(object.url.replace('rjson=','nojson=')), this.parse.bind(this), function(){
			  files.render().find('.torrent-filter').remove();
			  _this.empty();
		  }, false, {
            dataType: 'text',
			headers: addHeaders()
		  });
	  }
      this.externalids().then(function() {
        return _this.createSource();
      }).then(function(json) {
        if (balansers_with_search && !balansers_with_search.some(function(b) {
            return balanser.slice(0, b.length) == b;
          })) {
          filter.render().find('.filter--search').addClass('hide');
        }
        _this.search();
      })["catch"](function(e) {
        _this.noConnectToServer(e);
      });
    };
    this.rch = function(json, noreset) {
      var _this2 = this;
	  rchRun(json, function() {
        if (!noreset) _this2.find();
        else noreset();
	  });
    };
    this.externalids = function() {
      return new Promise(function(resolve, reject) {
        if (!object.movie.imdb_id || !object.movie.kinopoisk_id) {
          var query = [];
          query.push('id=' + encodeURIComponent(object.movie.id));
          query.push('serial=' + (object.movie.name ? 1 : 0));
          if (object.movie.imdb_id) query.push('imdb_id=' + (object.movie.imdb_id || ''));
          if (object.movie.kinopoisk_id) query.push('kinopoisk_id=' + (object.movie.kinopoisk_id || ''));
          var url = Defined.localhost + 'externalids?' + query.join('&');
          network.timeout(10000);
          network.silent(account(url), function(json) {
            for (var name in json) {
              object.movie[name] = json[name];
            }
            resolve();
          }, function() {
            resolve();
          }, false, {
              headers: addHeaders()
		  });
        } else resolve();
      });
    };
    this.updateBalanser = function(balanser_name) {
      var last_select_balanser = Lampa.Storage.cache('online_last_balanser', 3000, {});
      last_select_balanser[object.movie.id] = balanser_name;
      Lampa.Storage.set('online_last_balanser', last_select_balanser);
    };
    this.changeBalanser = function(balanser_name) {
      this.updateBalanser(balanser_name);
      Lampa.Storage.set('online_balanser', balanser_name);
      var to = this.getChoice(balanser_name);
      var from = this.getChoice();
      if (from.voice_name) to.voice_name = from.voice_name;
      this.saveChoice(to, balanser_name);
      Lampa.Activity.replace();
    };
    this.requestParams = function(url) {
      var query = [];
      var card_source = object.movie.source || 'tmdb'; //Lampa.Storage.field('source')
      query.push('id=' + encodeURIComponent(object.movie.id));

      if (object.movie.imdb_id) query.push('imdb_id=' + (object.movie.imdb_id || ''));
      if (object.movie.kinopoisk_id) query.push('kinopoisk_id=' + (object.movie.kinopoisk_id || ''));
      if (object.movie.tmdb_id) query.push('tmdb_id=' + (object.movie.tmdb_id || ''));

      if (object.movie.keywords && object.movie.keywords.results) {
         for (var i = 0, a = object.movie.keywords.results; i < a.length; i++) {
            if (a[i].name == 'anime') {
                query.push('anime=1');
                break;
            }
         }
      }

      query.push('title=' + encodeURIComponent(object.clarification ? object.search : object.movie.title || object.movie.name));
      query.push('original_title=' + encodeURIComponent(object.movie.original_title || object.movie.original_name));
      query.push('serial=' + (object.movie.name ? 1 : 0));
      query.push('original_language=' + (object.movie.original_language || ''));
      query.push('year=' + ((object.movie.release_date || object.movie.first_air_date || '0000') + '').slice(0, 4));
      query.push('source=' + card_source);
      if (card_source == 'tmdb' || card_source == 'cub') query.push('external_ids=true');
      query.push('clarification=' + (object.clarification ? 1 : 0));
      query.push('similar=' + (object.similar ? true : false));
      query.push('rchtype=' + (((window.rch_nws && window.rch_nws[hostkey]) ? window.rch_nws[hostkey].type : (window.rch && window.rch[hostkey]) ? window.rch[hostkey].type : '') || ''));
      if (Lampa.Storage.get('account_email', '')) query.push('cub_id=' + Lampa.Utils.hash(Lampa.Storage.get('account_email', '')));
      return url + (url.indexOf('?') >= 0 ? '&' : '?') + query.join('&');
    };
    this.getLastChoiceBalanser = function() {
      var last_select_balanser = Lampa.Storage.cache('online_last_balanser', 3000, {});
      if (last_select_balanser[object.movie.id]) {
        return last_select_balanser[object.movie.id];
      } else {
        return Lampa.Storage.get('online_balanser', filter_sources.length ? filter_sources[0] : '');
      }
    };
    this.startSource = function(json) {
      return new Promise(function(resolve, reject) {
        json.forEach(function(j) {
          var name = balanserName(j);
          sources[name] = {
            url: j.url,
            name: j.name,
            show: typeof j.show == 'undefined' ? true : j.show
          };
        });
        filter_sources = Lampa.Arrays.getKeys(sources);
        if (filter_sources.length) {
          var last_select_balanser = Lampa.Storage.cache('online_last_balanser', 3000, {});
          if (last_select_balanser[object.movie.id]) {
            balanser = last_select_balanser[object.movie.id];
          } else {
            balanser = Lampa.Storage.get('online_balanser', filter_sources[0]);
          }
          if (!sources[balanser]) balanser = filter_sources[0];
          if (!sources[balanser].show && !object.lampac_custom_select) balanser = filter_sources[0];
          source = sources[balanser].url;
          Lampa.Storage.set('active_balanser', balanser);
          resolve(json);
        } else {
          reject();
        }
      });
    };
    this.lifeSource = function() {
      var _this3 = this;
      return new Promise(function(resolve, reject) {
        var url = _this3.requestParams(Defined.localhost + 'lifeevents?memkey=' + (_this3.memkey || ''));
        var red = false;
        var gou = function gou(json, any) {
          if (json.accsdb) return reject(json);
          var last_balanser = _this3.getLastChoiceBalanser();
          if (!red) {
            var _filter = json.online.filter(function(c) {
              return any ? c.show : c.show && c.name.toLowerCase() == last_balanser;
            });
            if (_filter.length) {
              red = true;
              resolve(json.online.filter(function(c) {
                return c.show;
              }));
            } else if (any) {
              reject();
            }
          }
        };
        var fin = function fin(call) {
          network.timeout(8000);
          network.silent(account(url), function(json) {
            life_wait_times++;
            filter_sources = [];
            sources = {};
            json.online.forEach(function(j) {
              var name = balanserName(j);
              sources[name] = {
                url: j.url,
                name: j.name,
                show: typeof j.show == 'undefined' ? true : j.show
              };
            });
            filter_sources = Lampa.Arrays.getKeys(sources);
            filter.set('sort', filter_sources.map(function(e) {
              return {
                title: sources[e].name,
                source: e,
                selected: e == balanser,
                ghost: !sources[e].show
              };
            }));
            filter.chosen('sort', [sources[balanser] ? sources[balanser].name : balanser]);
            gou(json);
            var lastb = _this3.getLastChoiceBalanser();
            if (life_wait_times > 15 || json.ready) {
              filter.render().find('.lampac-balanser-loader').remove();
              gou(json, true);
            } else if (!red && sources[lastb] && sources[lastb].show) {
              gou(json, true);
              life_wait_timer = setTimeout(fin, 1000);
            } else {
              life_wait_timer = setTimeout(fin, 1000);
            }
          }, function() {
            life_wait_times++;
            if (life_wait_times > 15) {
              reject();
            } else {
              life_wait_timer = setTimeout(fin, 1000);
            }
          }, false, {
              headers: addHeaders()
		  });
        };
        fin();
      });
    };
    this.createSource = function() {
      var _this4 = this;
      return new Promise(function(resolve, reject) {
        var url = _this4.requestParams(Defined.localhost + 'lite/events?life=true');
        network.timeout(15000);
        network.silent(account(url), function(json) {
          if (json.accsdb) return reject(json);
          if (json.life) {
			_this4.memkey = json.memkey;
			if (json.title) {
              if (object.movie.name) object.movie.name = json.title;
              if (object.movie.title) object.movie.title = json.title;
			}
            filter.render().find('.filter--sort').append('<span class="lampac-balanser-loader" style="width: 1.2em; height: 1.2em; margin-top: 0; background: url(./img/loader.svg) no-repeat 50% 50%; background-size: contain; margin-left: 0.5em"></span>');
            _this4.lifeSource().then(_this4.startSource).then(resolve)["catch"](reject);
          } else {
            _this4.startSource(json).then(resolve)["catch"](reject);
          }
        }, reject, false, {
            headers: addHeaders()
		  });
      });
    };
    /**
     * Подготовка
     */
    this.create = function() {
      return this.render();
    };
    /**
     * Начать поиск
     */
    this.search = function() { //this.loading(true)
      this.filter({
        source: filter_sources
      }, this.getChoice());
      this.find();
    };
    this.find = function() {
      this.request(this.requestParams(source));
    };
    this.request = function(url, is_transient_retry) {
      var _this5 = this;
      if (!is_transient_retry && transient_retry_url !== url) {
        clearTimeout(transient_retry_timer);
        transient_retry_attempts = 0;
        transient_retry_url = url;
      }
      var request_source_name = String(balanser || '').toLowerCase();
      var is_filmix_request = request_source_name.indexOf('fxapi') === 0 || request_source_name.indexOf('filmix') === 0;
      network.timeout(is_filmix_request ? 25000 : 15000);
      number_of_requests++;
      if (number_of_requests < 10) {
        network["native"](account(url), function(str) {
          _this5.parse(str, url);
        }, function(er) {
          if (!_this5.retryTransientSource(er, url)) _this5.doesNotAnswer(er);
        }, false, {
          dataType: 'text',
		  headers: addHeaders()
        });
        clearTimeout(number_of_requests_timer);
        number_of_requests_timer = setTimeout(function() {
          number_of_requests = 0;
        }, 4000);
      } else this.empty();
    };
    this.clearTransientRetry = function() {
      clearTimeout(transient_retry_timer);
      transient_retry_attempts = 0;
      transient_retry_url = '';
    };
    this.retryTransientSource = function(er, url) {
      var _this6 = this;
      var source_name = String(balanser || '').toLowerCase();
      var is_filmix = source_name.indexOf('fxapi') === 0 || source_name.indexOf('filmix') === 0;
      if (!is_filmix || er && er.accsdb || !url) return false;
      var retry_status = er && typeof er.status !== "undefined" ? Number(er.status) : -1;
      var retry_error = String(er && (er.statusText || er.textStatus || er.message) || '').toLowerCase();
      var is_timeout = retry_status === 0 || retry_error.indexOf('timeout') >= 0 || retry_error.indexOf('timed out') >= 0;
      var retry_limit = is_timeout ? 1 : 4;
      if (transient_retry_url !== url) {
        clearTimeout(transient_retry_timer);
        transient_retry_attempts = 0;
        transient_retry_url = url;
      }
      if (transient_retry_attempts >= retry_limit) return false;
      transient_retry_attempts++;
      clearTimeout(transient_retry_timer);
      var retry_delays = [500, 1100, 2000, 3200];
      transient_retry_timer = setTimeout(function() {
        var active = Lampa.Activity.active && Lampa.Activity.active();
        if (!active || active.activity !== _this6.activity) return;
        _this6.request(url, true);
      }, retry_delays[transient_retry_attempts - 1]);
      this.activity.loader(true);
      return true;
    };
    this.parseJsonDate = function(str, name) {
      try {
        var html = $('<div>' + str + '</div>');
        var elems = [];
        html.find(name).each(function() {
          var item = $(this);
          var data = JSON.parse(item.attr('data-json'));
          var season = item.attr('s');
          var episode = item.attr('e');
          var text = item.text();
          if (!object.movie.name) {
            if (text.match(/\d+p/i)) {
              if (!data.quality) {
                data.quality = {};
                data.quality[text] = data.url;
              }
              text = object.movie.title;
            }
            if (text == 'По умолчанию') {
              text = object.movie.title;
            }
          }
          if (episode) data.episode = parseInt(episode);
          if (season) data.season = parseInt(season);
          if (text) data.text = text;
          data.active = item.hasClass('active');
          elems.push(data);
        });
        return elems;
      } catch (e) {
        return [];
      }
    };
    this.getFileUrl = function(file, call, waiting_rch, skip_link_track) {
	  var _this = this;
      var linkActivity;
      try {
        linkActivity = Lampa.Activity.active();
      } catch (ignored) {}
      var done = function(json, response) {
        if (!skip_link_track && json && typeof json.url == 'string' && json.url && window.ShowyMarketingRuntime) {
          try {
            window.ShowyMarketingRuntime.trackLinkResolved('showy_lampac', linkActivity);
          } catch (ignored) {}
        }
        call(json, response);
      };

      if(Lampa.Storage.field('player') !== 'inner' && file.stream && Lampa.Platform.is('apple')){
		  var newfile = Lampa.Arrays.clone(file);
		  newfile.method = 'play';
		  newfile.url = file.stream;
		  done(newfile, {});
	  }
      else if (file.method == 'play') done(file, {});
      else {
        Lampa.Loading.start(function() {
          Lampa.Loading.stop();
          Lampa.Controller.toggle('content');
          network.clear();
        });
        network["native"](account(file.url), function(json) {
			if(json.rch){
				if(waiting_rch) {
					waiting_rch = false;
					Lampa.Loading.stop();
					done(false, {});
				}
				else {
					_this.rch(json,function(){
						Lampa.Loading.stop();

						_this.getFileUrl(file, done, true, true);
					});
				}
			}
			else{
				Lampa.Loading.stop();
				done(json, json);
			}
        }, function() {
          Lampa.Loading.stop();
          done(false, {});
        }, false, {
            headers: addHeaders()
		  });
      }
    };
    this.toPlayElement = function(file) {
      var play = {
        title: file.title,
        url: file.url,
        quality: file.qualitys,
        timeline: file.timeline,
        subtitles: file.subtitles,
		segments: file.segments,
        callback: file.mark,
		season: file.season,
		episode: file.episode,
		voice_name: file.voice_name,
		thumbnail: file.thumbnail
      };
      return play;
    };
    this.orUrlReserve = function(data) {
      if (data.url && typeof data.url == 'string' && data.url.indexOf(" or ") !== -1) {
        var urls = data.url.split(" or ");
        data.url = urls[0];
        data.url_reserve = urls[1];
      }
    };
    this.setDefaultQuality = function(data) {
      if (Lampa.Arrays.getKeys(data.quality).length) {
        for (var q in data.quality) {
          if (parseInt(q) == Lampa.Storage.field('video_quality_default')) {
            data.url = data.quality[q];
            this.orUrlReserve(data);
          }
          if (data.quality[q].indexOf(" or ") !== -1)
            data.quality[q] = data.quality[q].split(" or ")[0];
        }
      }
    };
    this.display = function(videos) {
      var _this5 = this;
      this.draw(videos, {
        onEnter: function onEnter(item, html) {
          _this5.getFileUrl(item, function(json, json_call) {
            if (json && json.url) {
              var playlist = [];
              var first = _this5.toPlayElement(item);
              first.url = json.url;
              first.headers = json_call.headers || json.headers;
              first.quality = json_call.quality || item.qualitys;
			  first.segments = json_call.segments || item.segments;
              first.hls_manifest_timeout = json_call.hls_manifest_timeout || json.hls_manifest_timeout;
              first.subtitles = json.subtitles;
			  first.subtitles_call = json_call.subtitles_call || json.subtitles_call;
			  if (json.vast && json.vast.url) {
                first.vast_url = json.vast.url;
                first.vast_msg = json.vast.msg;
                first.vast_region = json.vast.region;
                first.vast_platform = json.vast.platform;
                first.vast_screen = json.vast.screen;
			  }
              _this5.orUrlReserve(first);
              _this5.setDefaultQuality(first);
              if (item.season) {
                videos.forEach(function(elem) {
                  var cell = _this5.toPlayElement(elem);
                  if (elem == item) cell.url = json.url;
                  else {
                    if (elem.method == 'call') {
                      if (Lampa.Storage.field('player') !== 'inner') {
                        cell.url = elem.stream;
						delete cell.quality;
                      } else {
                        cell.url = function(call) {
                          _this5.getFileUrl(elem, function(stream, stream_json) {
                            if (stream.url) {
                              cell.url = stream.url;
                              cell.quality = stream_json.quality || elem.qualitys;
							  cell.segments = stream_json.segments || elem.segments;
                              cell.subtitles = stream.subtitles;
                              _this5.orUrlReserve(cell);
                              _this5.setDefaultQuality(cell);
                              elem.mark();
                            } else {
                              cell.url = '';
                              Lampa.Noty.show(Lampa.Lang.translate('lampac_nolink'));
                            }
                            call();
                          }, function() {
                            cell.url = '';
                            call();
                          });
                        };
                      }
                    } else {
                      cell.url = elem.url;
                    }
                  }
                  _this5.orUrlReserve(cell);
                  _this5.setDefaultQuality(cell);
                  playlist.push(cell);
                }); //Lampa.Player.playlist(playlist)
              } else {
                playlist.push(first);
              }
              if (playlist.length > 1) first.playlist = playlist;
              if (first.url) {
                var element = first;
				element.isonline = true;

                Lampa.Player.play(element);
                Lampa.Player.playlist(playlist);
				if(element.subtitles_call) _this5.loadSubtitles(element.subtitles_call)
                item.mark();
                _this5.updateBalanser(balanser);
              } else {
                Lampa.Noty.show(Lampa.Lang.translate('lampac_nolink'));
              }
            } else Lampa.Noty.show(Lampa.Lang.translate('lampac_nolink'));
          }, true);
        },
        onContextMenu: function onContextMenu(item, html, data, call) {
          _this5.getFileUrl(item, function(stream) {
            call({
              file: stream.url,
              quality: item.qualitys
            });
          }, true);
        }
      });
      this.filter({
        season: filter_find.season.map(function(s) {
          return s.title;
        }),
        voice: filter_find.voice.map(function(b) {
          return b.title;
        })
      }, this.getChoice());
    };
	this.loadSubtitles = function(link){
		network.silent(account(link), function(subs){
			Lampa.Player.subtitles(subs)
		}, function() {},false, {
            headers: addHeaders()
		  })
	}
    this.parse = function(str, request_url) {
      var json = Lampa.Arrays.decodeJson(str, {});
      if (Lampa.Arrays.isObject(str) && str.rch) json = str;
      if (json.rch) return this.rch(json);
      try {
        var items = this.parseJsonDate(str, '.videos__item');
        var buttons = this.parseJsonDate(str, '.videos__button');
        if (items.length) this.clearTransientRetry();
        if (items.length == 1 && items[0].method == 'link' && !items[0].similar) {
          filter_find.season = items.map(function(s) {
            return {
              title: s.text,
              url: s.url
            };
          });
          this.replaceChoice({
            season: 0
          });
          this.request(items[0].url);
        } else {
          this.activity.loader(false);
          var videos = items.filter(function(v) {
            return v.method == 'play' || v.method == 'call';
          });
          var similar = items.filter(function(v) {
            return v.similar;
          });
          if (videos.length) {
            if (buttons.length) {
              filter_find.voice = buttons.map(function(b) {
                return {
                  title: b.text,
                  url: b.url
                };
              });
              var select_voice_url = this.getChoice(balanser).voice_url;
              var select_voice_name = this.getChoice(balanser).voice_name;
              var find_voice_url = buttons.find(function(v) {
                return v.url == select_voice_url;
              });
              var find_voice_name = buttons.find(function(v) {
                return v.text == select_voice_name;
              });
              var find_voice_active = buttons.find(function(v) {
                return v.active;
              }); ////console.log('b',buttons)
              ////console.log('u',find_voice_url)
              ////console.log('n',find_voice_name)
              ////console.log('a',find_voice_active)
              if (find_voice_url && !find_voice_url.active) {
                //console.log('Lampac', 'go to voice', find_voice_url);
                this.replaceChoice({
                  voice: buttons.indexOf(find_voice_url),
                  voice_name: find_voice_url.text
                });
                this.request(find_voice_url.url);
              } else if (find_voice_name && !find_voice_name.active) {
                //console.log('Lampac', 'go to voice', find_voice_name);
                this.replaceChoice({
                  voice: buttons.indexOf(find_voice_name),
                  voice_name: find_voice_name.text
                });
                this.request(find_voice_name.url);
              } else {
                if (find_voice_active) {
                  this.replaceChoice({
                    voice: buttons.indexOf(find_voice_active),
                    voice_name: find_voice_active.text
                  });
                }
                this.display(videos);
              }
            } else {
              this.replaceChoice({
                voice: 0,
                voice_url: '',
                voice_name: ''
              });
              this.display(videos);
            }
          } else if (items.length) {
            if (similar.length) {
              this.similars(similar);
              this.activity.loader(false);
            } else { //this.activity.loader(true)
              filter_find.season = items.map(function(s) {
                return {
                  title: s.text,
                  url: s.url
                };
              });
              var select_season = this.getChoice(balanser).season;
              var season = filter_find.season[select_season];
              if (!season) season = filter_find.season[0];
              //console.log('Lampac', 'go to season', season);
              this.request(season.url);
            }
          } else {
            if (!this.retryTransientSource(json, request_url)) this.doesNotAnswer(json);
          }
        }
      } catch (e) {
        //console.log('Lampac', 'error', e.stack);
        this.doesNotAnswer(e);
      }
    };
    this.similars = function(json) {
      var _this6 = this;
      scroll.clear();
      json.forEach(function(elem) {
        elem.title = elem.text;
        elem.info = '';
        var info = [];
        var year = ((elem.start_date || elem.year || object.movie.release_date || object.movie.first_air_date || '') + '').slice(0, 4);
        if (year) info.push(year);
        if (elem.details) info.push(elem.details);
        var name = elem.title || elem.text;
        elem.title = name;
        elem.time = elem.time || '';
        elem.info = info.join('<span class="online-prestige-split">●</span>');
        var item = Lampa.Template.get('lampac_prestige_folder', elem);
		if (elem.img) {
		  var image = $('<img style="height: 7em; width: 7em; border-radius: 0.3em;"/>');
		  item.find('.online-prestige__folder').empty().append(image);

		  if (elem.img !== undefined) {
		    if (elem.img.charAt(0) === '/')
		      elem.img = Defined.localhost + elem.img.substring(1);
		    if (elem.img.indexOf('/proxyimg') !== -1)
		      elem.img = account(elem.img);
		  }

		  Lampa.Utils.imgLoad(image, elem.img);
		}
        item.on('hover:enter', function() {
          _this6.reset();
          _this6.request(elem.url);
        }).on('hover:focus', function(e) {
          last = e.target;
          scroll.update($(e.target), true);
        });
        scroll.append(item);
      });
	  this.filter({
        season: filter_find.season.map(function(s) {
          return s.title;
        }),
        voice: filter_find.voice.map(function(b) {
          return b.title;
        })
      }, this.getChoice());
      Lampa.Controller.enable('content');
    };
    this.getChoice = function(for_balanser) {
      var data = Lampa.Storage.cache('online_choice_' + (for_balanser || balanser), 3000, {});
      var save = data[object.movie.id] || {};
      Lampa.Arrays.extend(save, {
        season: 0,
        voice: 0,
        voice_name: '',
        voice_id: 0,
        episodes_view: {},
        movie_view: ''
      });
      return save;
    };
    this.saveChoice = function(choice, for_balanser) {
      var data = Lampa.Storage.cache('online_choice_' + (for_balanser || balanser), 3000, {});
      data[object.movie.id] = choice;
      Lampa.Storage.set('online_choice_' + (for_balanser || balanser), data);
      this.updateBalanser(for_balanser || balanser);
    };
    this.replaceChoice = function(choice, for_balanser) {
      var to = this.getChoice(for_balanser);
      Lampa.Arrays.extend(to, choice, true);
      this.saveChoice(to, for_balanser);
    };
    this.clearImages = function() {
      images.forEach(function(img) {
        img.onerror = function() {};
        img.onload = function() {};
        img.src = '';
      });
      images = [];
    };
    /**
     * Очистить список файлов
     */
    this.reset = function() {
      last = false;
      this.clearTransientRetry();
      clearInterval(balanser_timer);
      network.clear();
      this.clearImages();
      scroll.render().find('.empty').remove();
      scroll.clear();
      scroll.reset();
      scroll.body().append(Lampa.Template.get('lampac_content_loading'));
    };
    /**
     * Загрузка
     */
    this.loading = function(status) {
      if (status) this.activity.loader(true);
      else {
        this.activity.loader(false);
        this.activity.toggle();
      }
    };
    /**
     * Построить фильтр
     */
    this.filter = function(filter_items, choice) {
      var _this7 = this;
      var select = [];
      var add = function add(type, title) {
        var need = _this7.getChoice();
        var items = filter_items[type];
        var subitems = [];
        var value = need[type];
        items.forEach(function(name, i) {
          subitems.push({
            title: name,
            selected: value == i,
            index: i
          });
        });
        select.push({
          title: title,
          subtitle: items[value],
          items: subitems,
          stype: type
        });
      };
      filter_items.source = filter_sources;
      select.push({
        title: Lampa.Lang.translate('torrent_parser_reset'),
        reset: true
      });
      this.saveChoice(choice);
      if (filter_items.voice && filter_items.voice.length) add('voice', Lampa.Lang.translate('torrent_parser_voice'));
      if (filter_items.season && filter_items.season.length) add('season', Lampa.Lang.translate('torrent_serial_season'));
      filter.set('filter', select);
      filter.set('sort', filter_sources.map(function(e) {
        return {
          title: sources[e].name,
          source: e,
          selected: e == balanser,
          ghost: !sources[e].show
        };
      }));
      this.selected(filter_items);
    };
    /**
     * Показать что выбрано в фильтре
     */
    this.selected = function(filter_items) {
      var need = this.getChoice(),
        select = [];
      for (var i in need) {
        if (filter_items[i] && filter_items[i].length) {
          if (i == 'voice') {
            select.push(filter_translate[i] + ': ' + filter_items[i][need[i]]);
          } else if (i !== 'source') {
            if (filter_items.season.length >= 1) {
              select.push(filter_translate.season + ': ' + filter_items[i][need[i]]);
            }
          }
        }
      }
      filter.chosen('filter', select);
      filter.chosen('sort', [sources[balanser].name]);
    };
    this.getEpisodes = function(season, call) {
      var episodes = [];
	  var tmdb_id = object.movie.id;
	  if (['cub', 'tmdb'].indexOf(object.movie.source || 'tmdb') == -1)
        tmdb_id = object.movie.tmdb_id;
      if (typeof tmdb_id == 'number' && object.movie.name) {
		  Lampa.Api.sources.tmdb.get('tv/' + tmdb_id + '/season/' + season, {}, function(data){
			  episodes = data.episodes || [];

			  call(episodes);
		  }, function(){
			  call(episodes);
		  })
      } else call(episodes);
    };
    this.watched = function(set) {
      var file_id = Lampa.Utils.hash(object.movie.number_of_seasons ? object.movie.original_name : object.movie.original_title);
      var watched = Lampa.Storage.cache('online_watched_last', 5000, {});
      if (set) {
        if (!watched[file_id]) watched[file_id] = {};
        Lampa.Arrays.extend(watched[file_id], set, true);
        Lampa.Storage.set('online_watched_last', watched);
        this.updateWatched();
      } else {
        return watched[file_id];
      }
    };
    this.updateWatched = function() {
      var watched = this.watched();
      var body = scroll.body().find('.online-prestige-watched .online-prestige-watched__body').empty();
      if (watched) {
        var line = [];
        if (watched.balanser_name) line.push(watched.balanser_name);
        if (watched.voice_name) line.push(watched.voice_name);
        if (watched.season) line.push(Lampa.Lang.translate('torrent_serial_season') + ' ' + watched.season);
        if (watched.episode) line.push(Lampa.Lang.translate('torrent_serial_episode') + ' ' + watched.episode);
        line.forEach(function(n) {
          body.append('<span>' + n + '</span>');
        });
      } else body.append('<span>' + Lampa.Lang.translate('lampac_no_watch_history') + '</span>');
    };
    /**
     * Отрисовка файлов
     */
    this.draw = function(items) {
      var _this8 = this;
      var params = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      if (!items.length) return this.empty();
      scroll.clear();
      if(!object.balanser)scroll.append(Lampa.Template.get('lampac_prestige_watched', {}));
      this.updateWatched();
      this.getEpisodes(items[0].season, function(episodes) {
        var viewed = Lampa.Storage.cache('online_view', 5000, []);
        var serial = object.movie.name ? true : false;
        var choice = _this8.getChoice();
        if (!choice || typeof choice !== 'object') choice = {};
        if (!choice.episodes_view || typeof choice.episodes_view !== 'object') choice.episodes_view = {};
        var fully = window.innerWidth > 480;
        var scroll_to_element = false;
        var scroll_to_mark = false;
        items.forEach(function(element, index) {
          var episode = serial && episodes.length && !params.similars ? episodes.find(function(e) {
            return e.episode_number == element.episode;
          }) : false;
          var episode_num = element.episode || index + 1;
          var episode_last = choice.episodes_view[element.season];
          var voice_name = choice.voice_name || (filter_find.voice[0] ? filter_find.voice[0].title : false) || element.voice_name || (serial ? 'Неизвестно' : element.text) || 'Неизвестно';
          var quality = pickQuality(element);
          if (element.quality && Lampa.Arrays.isObject(element.quality)) {
            element.qualitys = element.quality;
            element.quality = Lampa.Arrays.getKeys(element.quality)[0];
          }
          Lampa.Arrays.extend(element, {
            voice_name: voice_name,
            info: voice_name.length > 60 ? voice_name.substr(0, 60) + '...' : voice_name,
            quality: quality,
            time: Lampa.Utils.secondsToTime((episode ? episode.runtime : object.movie.runtime) * 60, true)
          });
          var hash_timeline = Lampa.Utils.hash(element.season ? [element.season, element.season > 10 ? ':' : '', element.episode, object.movie.original_title].join('') : object.movie.original_title);
          var hash_behold = Lampa.Utils.hash(element.season ? [element.season, element.season > 10 ? ':' : '', element.episode, object.movie.original_title, element.voice_name].join('') : object.movie.original_title + element.voice_name);
          var data = {
            hash_timeline: hash_timeline,
            hash_behold: hash_behold
          };
          var info = [];
          if (element.season) {
            element.translate_episode_end = _this8.getLastEpisode(items);
            element.translate_voice = element.voice_name;
          }
          if (element.text && !episode) element.title = element.text;
          element.timeline = Lampa.Timeline.view(hash_timeline);
          if (episode) {
            element.title = episode.name;
            if (element.info.length < 30 && episode.vote_average) info.push(Lampa.Template.get('lampac_prestige_rate', {
              rate: parseFloat(episode.vote_average + '').toFixed(1)
            }, true));
            if (episode.air_date && fully) info.push(Lampa.Utils.parseTime(episode.air_date).full);
          } else if (object.movie.release_date && fully) {
            info.push(Lampa.Utils.parseTime(object.movie.release_date).full);
          }
          if (!serial && object.movie.tagline && element.info.length < 30) info.push(object.movie.tagline);
          if (element.info) info.push(element.info);
          if (info.length) element.info = info.map(function(i) {
            return '<span>' + i + '</span>';
          }).join('<span class="online-prestige-split">●</span>');
          var html = Lampa.Template.get('lampac_prestige_full', element);
          var loader = html.find('.online-prestige__loader');
          var image = html.find('.online-prestige__img');
		  if(object.balanser) image.hide();
          if (!serial) {
            if (choice.movie_view == hash_behold) scroll_to_element = html;
          } else if (typeof episode_last !== 'undefined' && episode_last == episode_num) {
            scroll_to_element = html;
          }
          if (serial && !episode) {
            image.append('<div class="online-prestige__episode-number">' + formatEpisodeNumber(element.episode || index + 1) + '</div>');
            loader.remove();
          }
		  else if (!serial && object.movie.backdrop_path == 'undefined') loader.remove();
          else {
            var img = html.find('img')[0];
            img.onerror = function() {
              img.src = './img/img_broken.svg';
            };
            img.onload = function() {
              image.addClass('online-prestige__img--loaded');
              loader.remove();
              if (serial) image.append('<div class="online-prestige__episode-number">' + formatEpisodeNumber(element.episode || index + 1) + '</div>');
            };
            img.src = Lampa.TMDB.image('t/p/w300' + (episode ? episode.still_path : object.movie.backdrop_path));
            images.push(img);
			element.thumbnail = img.src
          }
          html.find('.online-prestige__timeline').append(Lampa.Timeline.render(element.timeline));
          if (viewed.indexOf(hash_behold) !== -1) {
            scroll_to_mark = html;
            html.find('.online-prestige__img').append('<div class="online-prestige__viewed">' + Lampa.Template.get('icon_viewed', {}, true) + '</div>');
          }
          element.mark = function() {
            viewed = Lampa.Storage.cache('online_view', 5000, []);
            if (viewed.indexOf(hash_behold) == -1) {
              viewed.push(hash_behold);
              Lampa.Storage.set('online_view', viewed);
              if (html.find('.online-prestige__viewed').length == 0) {
                html.find('.online-prestige__img').append('<div class="online-prestige__viewed">' + Lampa.Template.get('icon_viewed', {}, true) + '</div>');
              }
            }
            choice = _this8.getChoice();
            if (!choice || typeof choice !== 'object') choice = {};
            if (!choice.episodes_view || typeof choice.episodes_view !== 'object') choice.episodes_view = {};
            if (!serial) {
              choice.movie_view = hash_behold;
            } else {
              choice.episodes_view[element.season] = episode_num;
            }
            _this8.saveChoice(choice);
            var voice_name_text = choice.voice_name || element.voice_name || element.title;
            if (voice_name_text.length > 30) voice_name_text = voice_name_text.slice(0, 30) + '...';
            _this8.watched({
              balanser: balanser,
              balanser_name: Lampa.Utils.capitalizeFirstLetter(sources[balanser] ? sources[balanser].name.split(' ')[0] : balanser),
              voice_id: choice.voice_id,
              voice_name: voice_name_text,
              episode: element.episode,
              season: element.season
            });
          };
          element.unmark = function() {
            viewed = Lampa.Storage.cache('online_view', 5000, []);
            if (viewed.indexOf(hash_behold) !== -1) {
              Lampa.Arrays.remove(viewed, hash_behold);
              Lampa.Storage.set('online_view', viewed);
              Lampa.Storage.remove('online_view', hash_behold);
              html.find('.online-prestige__viewed').remove();
            }
          };
          element.timeclear = function() {
            element.timeline.percent = 0;
            element.timeline.time = 0;
            element.timeline.duration = 0;
            Lampa.Timeline.update(element.timeline);
          };
          html.on('hover:enter', function() {
            if (object.movie.id) Lampa.Favorite.add('history', object.movie, 100);
            if (params.onEnter) params.onEnter(element, html, data);
          }).on('hover:focus', function(e) {
            last = e.target;
            if (params.onFocus) params.onFocus(element, html, data);
            scroll.update($(e.target), true);
          });
          if (params.onRender) params.onRender(element, html, data);
          _this8.contextMenu({
            html: html,
            element: element,
            onFile: function onFile(call) {
              if (params.onContextMenu) params.onContextMenu(element, html, data, call);
            },
            onClearAllMark: function onClearAllMark() {
              items.forEach(function(elem) {
                elem.unmark();
              });
            },
            onClearAllTime: function onClearAllTime() {
              items.forEach(function(elem) {
                elem.timeclear();
              });
            }
          });
          scroll.append(html);
        });
        if (serial && episodes.length > items.length && !params.similars) {
          var left = episodes.slice(items.length);
          left.forEach(function(episode) {
            var info = [];
            if (episode.vote_average) info.push(Lampa.Template.get('lampac_prestige_rate', {
              rate: parseFloat(episode.vote_average + '').toFixed(1)
            }, true));
            if (episode.air_date) info.push(Lampa.Utils.parseTime(episode.air_date).full);
            var air = new Date((episode.air_date + '').replace(/-/g, '/'));
            var now = Date.now();
            var day = Math.round((air.getTime() - now) / (24 * 60 * 60 * 1000));
            var txt = Lampa.Lang.translate('full_episode_days_left') + ': ' + day;
            var html = Lampa.Template.get('lampac_prestige_full', {
              time: Lampa.Utils.secondsToTime((episode ? episode.runtime : object.movie.runtime) * 60, true),
              info: info.length ? info.map(function(i) {
                return '<span>' + i + '</span>';
              }).join('<span class="online-prestige-split">●</span>') : '',
              title: episode.name,
              quality: day > 0 ? txt : ''
            });
            var loader = html.find('.online-prestige__loader');
            var image = html.find('.online-prestige__img');
            var season = items[0] ? items[0].season : 1;
            html.find('.online-prestige__timeline').append(Lampa.Timeline.render(Lampa.Timeline.view(Lampa.Utils.hash([season, episode.episode_number, object.movie.original_title].join('')))));
            var img = html.find('img')[0];
            if (episode.still_path) {
              img.onerror = function() {
                img.src = './img/img_broken.svg';
              };
              img.onload = function() {
                image.addClass('online-prestige__img--loaded');
                loader.remove();
                image.append('<div class="online-prestige__episode-number">' + formatEpisodeNumber(episode.episode_number) + '</div>');
              };
              img.src = Lampa.TMDB.image('t/p/w300' + episode.still_path);
              images.push(img);
            } else {
              loader.remove();
              image.append('<div class="online-prestige__episode-number">' + formatEpisodeNumber(episode.episode_number) + '</div>');
            }
            html.on('hover:focus', function(e) {
              last = e.target;
              scroll.update($(e.target), true);
            });
            html.css('opacity', '0.5');
            scroll.append(html);
          });
        }
        if (scroll_to_element) {
          last = scroll_to_element[0];
        } else if (scroll_to_mark) {
          last = scroll_to_mark[0];
        }
        Lampa.Controller.enable('content');
      });
    };
    /**
     * Меню
     */
    this.contextMenu = function(params) {
      params.html.on('hover:long', function() {
        function show(extra) {
          var enabled = Lampa.Controller.enabled().name;
          var menu = [];
          if (Lampa.Platform.is('webos')) {
            menu.push({
              title: Lampa.Lang.translate('player_lauch') + ' - Webos',
              player: 'webos'
            });
          }
          if (Lampa.Platform.is('android')) {
            menu.push({
              title: Lampa.Lang.translate('player_lauch') + ' - Android',
              player: 'android'
            });
          }
          menu.push({
            title: Lampa.Lang.translate('player_lauch') + ' - Lampa',
            player: 'lampa'
          });
          menu.push({
            title: Lampa.Lang.translate('lampac_video'),
            separator: true
          });
          menu.push({
            title: Lampa.Lang.translate('torrent_parser_label_title'),
            mark: true
          });
          menu.push({
            title: Lampa.Lang.translate('torrent_parser_label_cancel_title'),
            unmark: true
          });
          menu.push({
            title: Lampa.Lang.translate('time_reset'),
            timeclear: true
          });
          if (extra) {
            menu.push({
              title: Lampa.Lang.translate('copy_link'),
              copylink: true
            });
          }
          if (window.lampac_online_context_menu)
            window.lampac_online_context_menu.push(menu, extra, params);
          menu.push({
            title: Lampa.Lang.translate('more'),
            separator: true
          });
          if (Lampa.Account.logged() && params.element && typeof params.element.season !== 'undefined' && params.element.translate_voice) {
            menu.push({
              title: Lampa.Lang.translate('lampac_voice_subscribe'),
              subscribe: true
            });
          }
          menu.push({
            title: Lampa.Lang.translate('lampac_clear_all_marks'),
            clearallmark: true
          });
          menu.push({
            title: Lampa.Lang.translate('lampac_clear_all_timecodes'),
            timeclearall: true
          });
          Lampa.Select.show({
            title: Lampa.Lang.translate('title_action'),
            items: menu,
            onBack: function onBack() {
              Lampa.Controller.toggle(enabled);
            },
            onSelect: function onSelect(a) {
              if (a.mark) params.element.mark();
              if (a.unmark) params.element.unmark();
              if (a.timeclear) params.element.timeclear();
              if (a.clearallmark) params.onClearAllMark();
              if (a.timeclearall) params.onClearAllTime();
              if (window.lampac_online_context_menu)
                window.lampac_online_context_menu.onSelect(a, params);
              Lampa.Controller.toggle(enabled);
              if (a.player) {
                Lampa.Player.runas(a.player);
                params.html.trigger('hover:enter');
              }
              if (a.copylink) {
                if (extra.quality) {
                  var qual = [];
                  for (var i in extra.quality) {
                    qual.push({
                      title: i,
                      file: extra.quality[i]
                    });
                  }
                  Lampa.Select.show({
                    title: Lampa.Lang.translate('settings_server_links'),
                    items: qual,
                    onBack: function onBack() {
                      Lampa.Controller.toggle(enabled);
                    },
                    onSelect: function onSelect(b) {
                      Lampa.Utils.copyTextToClipboard(b.file, function() {
                        Lampa.Noty.show(Lampa.Lang.translate('copy_secuses'));
                      }, function() {
                        Lampa.Noty.show(Lampa.Lang.translate('copy_error'));
                      });
                    }
                  });
                } else {
                  Lampa.Utils.copyTextToClipboard(extra.file, function() {
                    Lampa.Noty.show(Lampa.Lang.translate('copy_secuses'));
                  }, function() {
                    Lampa.Noty.show(Lampa.Lang.translate('copy_error'));
                  });
                }
              }
              if (a.subscribe) {
                Lampa.Account.subscribeToTranslation({
                  card: object.movie,
                  season: params.element.season,
                  episode: params.element.translate_episode_end,
                  voice: params.element.translate_voice
                }, function() {
                  Lampa.Noty.show(Lampa.Lang.translate('lampac_voice_success'));
                }, function() {
                  Lampa.Noty.show(Lampa.Lang.translate('lampac_voice_error'));
                });
              }
            }
          });
        }
        params.onFile(show);
      }).on('hover:focus', function() {
        if (Lampa.Helper) Lampa.Helper.show('online_file', Lampa.Lang.translate('helper_online_file'), params.html);
      });
    };
    /**
     * Показать пустой результат
     */
    this.empty = function() {
      var html = Lampa.Template.get('lampac_does_not_answer', {});
      html.find('.online-empty__buttons').remove();
      html.find('.online-empty__title').text(Lampa.Lang.translate('empty_title_two'));
      html.find('.online-empty__time').text(Lampa.Lang.translate('empty_text'));
      scroll.clear();
      scroll.append(html);
      this.loading(false);
    };
	    this.noConnectToServer = function(er) {
	      if (er && er.accsdb && (
	        er.msg === 'Авторизация неактивна' ||
	        er.msg === 'Не авторизован' ||
	        er.msg === 'Продлите PRO-подписку' ||
	        er.msg === 'Резервный бот не активен'
	      )) {
	        if (SHOWY_TOKEN_POOL.length > 1 && showyAuthFixTries < 3) {
	          showyAuthFixTries++;
	          showyRotateToken();
	          var self = this;
	          this.loading(false);
	          setTimeout(function() { try { self.reset(); } catch (e) {} }, 300);
	          return;
	        }
	        showyAuthFixTries = 0;
	        this.loading(false);
	        return showyHandleContentAuthError(this, false);
	      }
	      var html = Lampa.Template.get('lampac_does_not_answer', {});
	      html.find('.online-empty__buttons').remove();
      html.find('.online-empty__title').text(Lampa.Lang.translate('title_error'));
      html.find('.online-empty__time').text(er && er.accsdb ? er.msg : Lampa.Lang.translate('lampac_does_not_answer_text').replace('{balanser}', currentBalanserName()));
      scroll.clear();
      scroll.append(html);
      this.loading(false);
    };
	    this.doesNotAnswer = function(er) {
	      var _this9 = this;
	      if (er && er.accsdb && (
	        er.msg === 'Авторизация неактивна' ||
	        er.msg === 'Не авторизован' ||
	        er.msg === 'Продлите PRO-подписку' ||
	        er.msg === 'Резервный бот не активен'
	      )) {
	        if (SHOWY_TOKEN_POOL.length > 1 && showyAuthFixTries < 3) {
	          showyAuthFixTries++;
	          showyRotateToken();
	          this.loading(false);
	          setTimeout(function() { try { _this9.reset(); } catch (e) {} }, 300);
	          return;
	        }
	        showyAuthFixTries = 0;
	        this.loading(false);
	        return showyHandleContentAuthError(this, true);
	      }
	      this.reset();
      var html = Lampa.Template.get('lampac_does_not_answer', {
        balanser: balanser
      });
      if(er && er.accsdb) html.find('.online-empty__title').html(er.msg);

      var tic = er && er.accsdb ? 10 : 5;
      html.find('.cancel').on('hover:enter', function() {
        clearInterval(balanser_timer);
      });
      html.find('.change').on('hover:enter', function() {
        clearInterval(balanser_timer);
        filter.render().find('.filter--sort').trigger('hover:enter');
      });
      scroll.clear();
      scroll.append(html);
      this.loading(false);
      balanser_timer = setInterval(function() {
        tic--;
        html.find('.timeout').text(tic);
        if (tic == 0) {
          clearInterval(balanser_timer);
          var keys = Lampa.Arrays.getKeys(sources);
          var indx = keys.indexOf(balanser);
          var next = keys[indx + 1];
          if (!next) next = keys[0];
          balanser = next;
          if (Lampa.Activity.active().activity == _this9.activity) _this9.changeBalanser(balanser);
        }
      }, 1000);
    };
    this.getLastEpisode = function(items) {
      var last_episode = 0;
      items.forEach(function(e) {
        if (typeof e.episode !== 'undefined') last_episode = Math.max(last_episode, parseInt(e.episode));
      });
      return last_episode;
    };
    /**
     * Начать навигацию по файлам
     */
    this.start = function() {
      if (Lampa.Activity.active().activity !== this.activity) return;
      if (!initialized) {
        initialized = true;
        this.initialize();
      }
      Lampa.Background.immediately(Lampa.Utils.cardImgBackgroundBlur(object.movie));
      Lampa.Controller.add('content', {
        toggle: function toggle() {
          Lampa.Controller.collectionSet(scroll.render(), files.render());
          Lampa.Controller.collectionFocus(last || false, scroll.render());
        },
        gone: function gone() {
          clearTimeout(balanser_timer);
        },
        up: function up() {
          if (Navigator.canmove('up')) {
            Navigator.move('up');
          } else Lampa.Controller.toggle('head');
        },
        down: function down() {
          Navigator.move('down');
        },
        right: function right() {
          if (Navigator.canmove('right')) Navigator.move('right');
          else filter.show(Lampa.Lang.translate('title_filter'), 'filter');
        },
        left: function left() {
          if (Navigator.canmove('left')) Navigator.move('left');
          else Lampa.Controller.toggle('menu');
        },
        back: this.back.bind(this)
      });
      Lampa.Controller.toggle('content');
    };
    this.render = function() {
      return files.render();
    };
    this.back = function() {
      Lampa.Activity.backward();
    };
    this.pause = function() {};
    this.stop = function() {};
    this.destroy = function() {
      network.clear();
      this.clearTransientRetry();
      this.clearImages();
      files.destroy();
      scroll.destroy();
      clearInterval(balanser_timer);
      clearTimeout(life_wait_timer);
    };
  }

  function addSourceSearch(spiderName, spiderUri) {
    var network = new Lampa.Reguest();

    var source = {
      title: spiderName,
      search: function(params, oncomplite) {
        function searchComplite(links) {
          var keys = Lampa.Arrays.getKeys(links);

          if (keys.length) {
            var status = new Lampa.Status(keys.length);

            status.onComplite = function(result) {
              var rows = [];

              keys.forEach(function(name) {
                var line = result[name];

                if (line && line.data && line.type == 'similar') {
                  var cards = line.data.map(function(item) {
                    item.title = Lampa.Utils.capitalizeFirstLetter(item.title);
                    item.release_date = item.year || '0000';
                    item.balanser = spiderUri;
                    if (item.img !== undefined) {
                      if (item.img.charAt(0) === '/')
                        item.img = Defined.localhost + item.img.substring(1);
                      if (item.img.indexOf('/proxyimg') !== -1)
                        item.img = account(item.img);
                    }

                    return item;
                  })

                  rows.push({
                    title: name,
                    results: cards
                  })
                }
              })

              oncomplite(rows);
            }

            keys.forEach(function(name) {
              network.silent(account(links[name]), function(data) {
                status.append(name, data);
              }, function() {
                status.error();
              }, false, {
                  headers: addHeaders()
		  })
            })
          } else {
            oncomplite([]);
          }
        }

        network.silent(account(Defined.localhost + 'lite/' + spiderUri + '?title=' + params.query), function(json) {
          if (json.rch) {
            rchRun(json, function() {
              network.silent(account(Defined.localhost + 'lite/' + spiderUri + '?title=' + params.query), function(links) {
                searchComplite(links);
              }, function() {
                oncomplite([]);
              }, false, {
                  headers: addHeaders()
		  });
            });
          } else {
            searchComplite(json);
          }
        }, function() {
          oncomplite([]);
        }, false, {
            headers: addHeaders()
		  });
      },
      onCancel: function() {
        network.clear()
      },
      params: {
        lazy: true,
        align_left: true,
        card_events: {
          onMenu: function() {}
        }
      },
      onMore: function(params, close) {
        close();
      },
      onSelect: function(params, close) {
        close();

        showyEnsureProAuth(function() {
          Lampa.Activity.push({
            url: params.element.url,
            title: 'Lampac - ' + params.element.title,
            component: 'showy_lampac',
            movie: params.element,
            page: 1,
            search: params.element.title,
            clarification: true,
            balanser: params.element.balanser,
            noinfo: true
          });
        });
      }
    }

    Lampa.Search.addSource(source)
  }

  function startPlugin() {
    window.showy_lampac_plugin = true;
    var manifst = {
      type: 'video',
	      version: '1.7.1',
	      name: 'Showy',
	      description: 'Плагин для просмотра онлайн сериалов и фильмов',
	      component: 'showy_lampac',
          onContextMenu: function onContextMenu(object) {
            return {
              name: 'Showy',
              description: Lampa.Lang.translate('lampac_watch')
            };
          },
          onContextLauch: function onContextLauch(object) {
            openShowyPro(object);
          }
	    };

    function pushShowyProActivity(activity) {
      showyEnsureProAuth(function() {
        resetTemplates();
        Lampa.Component.add('showy_lampac', component);
        Lampa.Activity.push(activity);
      });
    }

    function openShowyPro(object) {
      if (!object) return;

      var original = object.number_of_seasons ? object.original_name : object.original_title;
      var id = Lampa.Utils.hash(original || object.original_title || object.original_name || object.title || object.name || '');
      var all = Lampa.Storage.get('clarification_search','{}');

      pushShowyProActivity({
        url: '',
        title: Lampa.Lang.translate('title_online_showy'),
        component: 'showy_lampac',
        search: all[id] ? all[id] : (object.title || object.name || object.original_title || object.original_name || ''),
        search_one: object.title || object.name,
        search_two: object.original_title || object.original_name,
        movie: object,
        page: 1,
        clarification: all[id] ? true : false
      });
    }

    function registerShowyProManifest() {
      var plugins = Lampa.Manifest.plugins || [];
      if (Object.prototype.toString.call(plugins) != '[object Array]') plugins = [plugins];

      for (var i = 0; i < plugins.length; i++) {
        if (plugins[i] && plugins[i].component == manifst.component) {
          plugins[i].type = manifst.type;
          plugins[i].version = manifst.version;
          plugins[i].name = manifst.name;
          plugins[i].description = manifst.description;
          plugins[i].onContextMenu = manifst.onContextMenu;
          plugins[i].onContextLauch = manifst.onContextLauch;
          Lampa.Manifest.plugins = plugins;
          return;
        }
      }

      plugins.push(manifst);
      Lampa.Manifest.plugins = plugins;
    }

    registerShowyProManifest();
    if (Lampa.Listener && Lampa.Listener.follow) {
      Lampa.Listener.follow('app', function(e) {
        if (e.type == 'ready') setTimeout(registerShowyProManifest, 0);
      });
    }
    setTimeout(registerShowyProManifest, 1000);
    setTimeout(registerShowyProManifest, 3000);
    Lampa.Lang.add({
      lampac_watch: { //
        ru: 'Смотреть онлайн',
        en: 'Watch online',
        uk: 'Дивитися онлайн',
        zh: '在线观看'
      },
      lampac_video: { //
        ru: 'Видео',
        en: 'Video',
        uk: 'Відео',
        zh: '视频'
      },
      lampac_no_watch_history: {
        ru: 'Нет истории просмотра',
        en: 'No browsing history',
        ua: 'Немає історії перегляду',
        zh: '没有浏览历史'
      },
      lampac_nolink: {
        ru: 'Не удалось извлечь ссылку',
        uk: 'Неможливо отримати посилання',
        en: 'Failed to fetch link',
        zh: '获取链接失败'
      },
      lampac_balanser: { //
        ru: 'Источник',
        uk: 'Джерело',
        en: 'Source',
        zh: '来源'
      },
      helper_online_file: { //
        ru: 'Удерживайте клавишу "ОК" для вызова контекстного меню',
        uk: 'Утримуйте клавішу "ОК" для виклику контекстного меню',
        en: 'Hold the "OK" key to bring up the context menu',
        zh: '按住“确定”键调出上下文菜单'
      },
      title_online: { //
        ru: 'Онлайн',
        uk: 'Онлайн',
        en: 'Online',
        zh: '在线的'
      },
      title_online_showy: {
        ru: 'Showy',
        uk: 'Showy',
        en: 'Showy',
        zh: 'Showy'
      },
      lampac_voice_subscribe: { //
        ru: 'Подписаться на перевод',
        uk: 'Підписатися на переклад',
        en: 'Subscribe to translation',
        zh: '订阅翻译'
      },
      lampac_voice_success: { //
        ru: 'Вы успешно подписались',
        uk: 'Ви успішно підписалися',
        en: 'You have successfully subscribed',
        zh: '您已成功订阅'
      },
      lampac_voice_error: { //
        ru: 'Возникла ошибка',
        uk: 'Виникла помилка',
        en: 'An error has occurred',
        zh: '发生了错误'
      },
      lampac_clear_all_marks: { //
        ru: 'Очистить все метки',
        uk: 'Очистити всі мітки',
        en: 'Clear all labels',
        zh: '清除所有标签'
      },
      lampac_clear_all_timecodes: { //
        ru: 'Очистить все тайм-коды',
        uk: 'Очистити всі тайм-коди',
        en: 'Clear all timecodes',
        zh: '清除所有时间代码'
      },
      lampac_change_balanser: { //
        ru: 'Изменить балансер',
        uk: 'Змінити балансер',
        en: 'Change balancer',
        zh: '更改平衡器'
      },
      lampac_balanser_dont_work: { //
        ru: 'Поиск на ({balanser}) не дал результатов',
        uk: 'Пошук на ({balanser}) не дав результатів',
        en: 'Search on ({balanser}) did not return any results',
        zh: '搜索 ({balanser}) 未返回任何结果'
      },
      lampac_balanser_timeout: { //
        ru: 'Источник будет переключен автоматически через <span class="timeout">10</span> секунд.',
        uk: 'Джерело буде автоматично переключено через <span class="timeout">10</span> секунд.',
        en: 'The source will be switched automatically after <span class="timeout">10</span> seconds.',
        zh: '平衡器将在<span class="timeout">10</span>秒内自动切换。'
      },
      lampac_does_not_answer_text: {
        ru: 'Поиск на ({balanser}) не дал результатов',
        uk: 'Пошук на ({balanser}) не дав результатів',
        en: 'Search on ({balanser}) did not return any results',
        zh: '搜索 ({balanser}) 未返回任何结果'
      }
    });
    Lampa.Template.add('lampac_css', "\n        <style>\n        @charset 'UTF-8';.online-prestige{position:relative;-webkit-border-radius:.3em;border-radius:.3em;background-color:rgba(0,0,0,0.3);display:-webkit-box;display:-webkit-flex;display:-moz-box;display:-ms-flexbox;display:flex}.online-prestige__body{padding:1.2em;line-height:1.3;-webkit-box-flex:1;-webkit-flex-grow:1;-moz-box-flex:1;-ms-flex-positive:1;flex-grow:1;position:relative}@media screen and (max-width:480px){.online-prestige__body{padding:.8em 1.2em}}.online-prestige__img{position:relative;width:13em;-webkit-flex-shrink:0;-ms-flex-negative:0;flex-shrink:0;min-height:8.2em}.online-prestige__img>img{position:absolute;top:0;left:0;width:100%;height:100%;-o-object-fit:cover;object-fit:cover;-webkit-border-radius:.3em;border-radius:.3em;opacity:0;-webkit-transition:opacity .3s;-o-transition:opacity .3s;-moz-transition:opacity .3s;transition:opacity .3s}.online-prestige__img--loaded>img{opacity:1}@media screen and (max-width:480px){.online-prestige__img{width:7em;min-height:6em}}.online-prestige__folder{padding:1em;-webkit-flex-shrink:0;-ms-flex-negative:0;flex-shrink:0}.online-prestige__folder>svg{width:4.4em !important;height:4.4em !important}.online-prestige__viewed{position:absolute;top:1em;left:1em;background:rgba(0,0,0,0.45);-webkit-border-radius:100%;border-radius:100%;padding:.25em;font-size:.76em}.online-prestige__viewed>svg{width:1.5em !important;height:1.5em !important}.online-prestige__episode-number{position:absolute;top:0;left:0;right:0;bottom:0;display:-webkit-box;display:-webkit-flex;display:-moz-box;display:-ms-flexbox;display:flex;-webkit-box-align:center;-webkit-align-items:center;-moz-box-align:center;-ms-flex-align:center;align-items:center;-webkit-box-pack:center;-webkit-justify-content:center;-moz-box-pack:center;-ms-flex-pack:center;justify-content:center;font-size:2em}.online-prestige__loader{position:absolute;top:50%;left:50%;width:2em;height:2em;margin-left:-1em;margin-top:-1em;background:url(./img/loader.svg) no-repeat center center;-webkit-background-size:contain;-o-background-size:contain;background-size:contain}.online-prestige__head,.online-prestige__footer{display:-webkit-box;display:-webkit-flex;display:-moz-box;display:-ms-flexbox;display:flex;-webkit-box-pack:justify;-webkit-justify-content:space-between;-moz-box-pack:justify;-ms-flex-pack:justify;justify-content:space-between;-webkit-box-align:center;-webkit-align-items:center;-moz-box-align:center;-ms-flex-align:center;align-items:center}.online-prestige__timeline{margin:.8em 0}.online-prestige__timeline>.time-line{display:block !important}.online-prestige__title{font-size:1.7em;overflow:hidden;-o-text-overflow:ellipsis;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:1;line-clamp:1;-webkit-box-orient:vertical}@media screen and (max-width:480px){.online-prestige__title{font-size:1.4em}}.online-prestige__time{padding-left:2em}.online-prestige__info{display:-webkit-box;display:-webkit-flex;display:-moz-box;display:-ms-flexbox;display:flex;-webkit-box-align:center;-webkit-align-items:center;-moz-box-align:center;-ms-flex-align:center;align-items:center}.online-prestige__info>*{overflow:hidden;-o-text-overflow:ellipsis;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:1;line-clamp:1;-webkit-box-orient:vertical}.online-prestige__quality{padding-left:1em;white-space:nowrap}.online-prestige__scan-file{position:absolute;bottom:0;left:0;right:0}.online-prestige__scan-file .broadcast__scan{margin:0}.online-prestige .online-prestige-split{font-size:.8em;margin:0 1em;-webkit-flex-shrink:0;-ms-flex-negative:0;flex-shrink:0}.online-prestige.focus::after{content:'';position:absolute;top:-0.6em;left:-0.6em;right:-0.6em;bottom:-0.6em;-webkit-border-radius:.7em;border-radius:.7em;border:solid .3em #fff;z-index:-1;pointer-events:none}.online-prestige+.online-prestige{margin-top:1.5em}.online-prestige--folder .online-prestige__footer{margin-top:.8em}.online-prestige-watched{padding:1em}.online-prestige-watched__icon>svg{width:1.5em;height:1.5em}.online-prestige-watched__body{padding-left:1em;padding-top:.1em;display:-webkit-box;display:-webkit-flex;display:-moz-box;display:-ms-flexbox;display:flex;-webkit-flex-wrap:wrap;-ms-flex-wrap:wrap;flex-wrap:wrap}.online-prestige-watched__body>span+span::before{content:' ● ';vertical-align:top;display:inline-block;margin:0 .5em}.online-prestige-rate{display:-webkit-inline-box;display:-webkit-inline-flex;display:-moz-inline-box;display:-ms-inline-flexbox;display:inline-flex;-webkit-box-align:center;-webkit-align-items:center;-moz-box-align:center;-ms-flex-align:center;align-items:center}.online-prestige-rate>svg{width:1.3em !important;height:1.3em !important}.online-prestige-rate>span{font-weight:600;font-size:1.1em;padding-left:.7em}.online-empty{line-height:1.4}.online-empty__title{font-size:1.8em;margin-bottom:.3em}.online-empty__time{font-size:1.2em;font-weight:300;margin-bottom:1.6em}.online-empty__buttons{display:-webkit-box;display:-webkit-flex;display:-moz-box;display:-ms-flexbox;display:flex}.online-empty__buttons>*+*{margin-left:1em}.online-empty__button{background:rgba(0,0,0,0.3);font-size:1.2em;padding:.5em 1.2em;-webkit-border-radius:.2em;border-radius:.2em;margin-bottom:2.4em}.online-empty__button.focus{background:#fff;color:black}.online-empty__templates .online-empty-template:nth-child(2){opacity:.5}.online-empty__templates .online-empty-template:nth-child(3){opacity:.2}.online-empty-template{background-color:rgba(255,255,255,0.3);padding:1em;display:-webkit-box;display:-webkit-flex;display:-moz-box;display:-ms-flexbox;display:flex;-webkit-box-align:center;-webkit-align-items:center;-moz-box-align:center;-ms-flex-align:center;align-items:center;-webkit-border-radius:.3em;border-radius:.3em}.online-empty-template>*{background:rgba(0,0,0,0.3);-webkit-border-radius:.3em;border-radius:.3em}.online-empty-template__ico{width:4em;height:4em;margin-right:2.4em}.online-empty-template__body{height:1.7em;width:70%}.online-empty-template+.online-empty-template{margin-top:1em}\n        </style>\n    ");
    $('body').append(Lampa.Template.get('lampac_css', {}, true));

    function resetTemplates() {
      Lampa.Template.add('lampac_prestige_full', "<div class=\"online-prestige online-prestige--full selector\">\n            <div class=\"online-prestige__img\">\n                <img alt=\"\">\n                <div class=\"online-prestige__loader\"></div>\n            </div>\n            <div class=\"online-prestige__body\">\n                <div class=\"online-prestige__head\">\n                    <div class=\"online-prestige__title\">{title}</div>\n                    <div class=\"online-prestige__time\">{time}</div>\n                </div>\n\n                <div class=\"online-prestige__timeline\"></div>\n\n                <div class=\"online-prestige__footer\">\n                    <div class=\"online-prestige__info\">{info}</div>\n                    <div class=\"online-prestige__quality\">{quality}</div>\n                </div>\n            </div>\n        </div>");
      Lampa.Template.add('lampac_content_loading', "<div class=\"online-empty\">\n            <div class=\"broadcast__scan\"><div></div></div>\n\t\t\t\n            <div class=\"online-empty__templates\">\n                <div class=\"online-empty-template selector\">\n                    <div class=\"online-empty-template__ico\"></div>\n                    <div class=\"online-empty-template__body\"></div>\n                </div>\n                <div class=\"online-empty-template\">\n                    <div class=\"online-empty-template__ico\"></div>\n                    <div class=\"online-empty-template__body\"></div>\n                </div>\n                <div class=\"online-empty-template\">\n                    <div class=\"online-empty-template__ico\"></div>\n                    <div class=\"online-empty-template__body\"></div>\n                </div>\n            </div>\n        </div>");
      Lampa.Template.add('lampac_does_not_answer', "<div class=\"online-empty\">\n            <div class=\"online-empty__title\">\n                #{lampac_balanser_dont_work}\n            </div>\n            <div class=\"online-empty__time\">\n                #{lampac_balanser_timeout}\n            </div>\n            <div class=\"online-empty__buttons\">\n                <div class=\"online-empty__button selector cancel\">#{cancel}</div>\n                <div class=\"online-empty__button selector change\">#{lampac_change_balanser}</div>\n            </div>\n            <div class=\"online-empty__templates\">\n                <div class=\"online-empty-template\">\n                    <div class=\"online-empty-template__ico\"></div>\n                    <div class=\"online-empty-template__body\"></div>\n                </div>\n                <div class=\"online-empty-template\">\n                    <div class=\"online-empty-template__ico\"></div>\n                    <div class=\"online-empty-template__body\"></div>\n                </div>\n                <div class=\"online-empty-template\">\n                    <div class=\"online-empty-template__ico\"></div>\n                    <div class=\"online-empty-template__body\"></div>\n                </div>\n            </div>\n        </div>");
      Lampa.Template.add('lampac_prestige_rate', "<div class=\"online-prestige-rate\">\n            <svg width=\"17\" height=\"16\" viewBox=\"0 0 17 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n                <path d=\"M8.39409 0.192139L10.99 5.30994L16.7882 6.20387L12.5475 10.4277L13.5819 15.9311L8.39409 13.2425L3.20626 15.9311L4.24065 10.4277L0 6.20387L5.79819 5.30994L8.39409 0.192139Z\" fill=\"#fff\"></path>\n            </svg>\n            <span>{rate}</span>\n        </div>");
      Lampa.Template.add('lampac_prestige_folder', "<div class=\"online-prestige online-prestige--folder selector\">\n            <div class=\"online-prestige__folder\">\n                <svg viewBox=\"0 0 128 112\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n                    <rect y=\"20\" width=\"128\" height=\"92\" rx=\"13\" fill=\"white\"></rect>\n                    <path d=\"M29.9963 8H98.0037C96.0446 3.3021 91.4079 0 86 0H42C36.5921 0 31.9555 3.3021 29.9963 8Z\" fill=\"white\" fill-opacity=\"0.23\"></path>\n                    <rect x=\"11\" y=\"8\" width=\"106\" height=\"76\" rx=\"13\" fill=\"white\" fill-opacity=\"0.51\"></rect>\n                </svg>\n            </div>\n            <div class=\"online-prestige__body\">\n                <div class=\"online-prestige__head\">\n                    <div class=\"online-prestige__title\">{title}</div>\n                    <div class=\"online-prestige__time\">{time}</div>\n                </div>\n\n                <div class=\"online-prestige__footer\">\n                    <div class=\"online-prestige__info\">{info}</div>\n                </div>\n            </div>\n        </div>");
      Lampa.Template.add('lampac_prestige_watched', "<div class=\"online-prestige online-prestige-watched selector\">\n            <div class=\"online-prestige-watched__icon\">\n                <svg width=\"21\" height=\"21\" viewBox=\"0 0 21 21\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n                    <circle cx=\"10.5\" cy=\"10.5\" r=\"9\" stroke=\"currentColor\" stroke-width=\"3\"/>\n                    <path d=\"M14.8477 10.5628L8.20312 14.399L8.20313 6.72656L14.8477 10.5628Z\" fill=\"currentColor\"/>\n                </svg>\n            </div>\n            <div class=\"online-prestige-watched__body\">\n                \n            </div>\n        </div>");
    }
    var button = "<div class=\"full-start__button selector view--online-showy showy-lampac--button\" data-subtitle=\"".concat(manifst.name, " v").concat(manifst.version, "\">\n        <svg xmlns=\"http://www.w3.org/2000/svg\" width=\"1.2em\" height=\"1.2em\" viewBox=\"0 0 24 24\"><path fill=\"currentColor\" d=\"M21 16.5c0 .38-.21.71-.53.88l-7.9 4.44c-.16.12-.36.18-.57.18s-.41-.06-.57-.18l-7.9-4.44A.99.99 0 0 1 3 16.5v-9c0-.38.21-.71.53-.88l7.9-4.44c.16-.12.36-.18.57-.18s.41.06.57.18l7.9 4.44c.32.17.53.5.53.88zM5 9v6h1.25v-2H7a2 2 0 0 0 2-2a2 2 0 0 0-2-2zm1.25 3v-2h.5a1 1 0 0 1 1 1a1 1 0 0 1-1 1zm3.5-3v6H11v-2h.75l.66 2h1.32l-.79-2.39c.49-.36.81-.95.81-1.61a2 2 0 0 0-2-2zM11 12v-2h.5a1 1 0 0 1 1 1a1 1 0 0 1-1 1zm6-3c-1.38 0-2.5 1.34-2.5 3s1.12 3 2.5 3s2.5-1.34 2.5-3s-1.12-3-2.5-3m0 1.25c.76 0 1.38.78 1.38 1.75s-.62 1.75-1.38 1.75s-1.37-.78-1.37-1.75s.61-1.75 1.37-1.75\"/></svg>\n\n        <span>#{title_online_showy}</span>\n    </div>"); // нужна заглушка, а то при страте лампы говорит пусто
    Lampa.Component.add('showy_lampac', component); //то же самое
    resetTemplates();

	    function addButton(e) {
	      if (!e.render || !e.render.length) return;
	      if (e.render.find('.showy-lampac--button').length) return;
      var btn = $(Lampa.Lang.translate(button));
	  // //console.log(btn.clone().removeClass('focus').prop('outerHTML'))
      btn.on('hover:enter', function() {
        openShowyPro(e.movie);
      });
	      e.render.before(btn);
	    }
	    Lampa.Listener.follow('full', function(e) {
	      if (e.type == 'complite') {
	        addButton({
	          render: e.object.activity.render().find('.button--play, .view--torrent').first(),
	          movie: e.data.movie
	        });
	      }
	    });
	    try {
	      if (Lampa.Activity.active().component == 'full') {
	        addButton({
	          render: Lampa.Activity.active().activity.render().find('.button--play, .view--torrent').first(),
	          movie: Lampa.Activity.active().card
	        });
	      }
    } catch (e) {}
    if (Lampa.Manifest.app_digital >= 177) {
        var balansers_sync = [
            "filmix",
            "filmixtv",
            "fxapi",
            "filmixrezka",
            "rezka",
            "pizdatoehd",
            "getstv",
            "kinopub",
            "zetflixdb",
            "collaps",
            "hdvb",
            "kodik",
            "bamboo",
            "eneyida",
            "kinoukr",
            "uafilm",
            "uakino",
            "kinotochka",
            "remux",
            "anilibria",
            "animedia",
            "animego",
            "animevost",
            "animebesst",
            "alloha",
            "mirage",
            "phantom",
            "animelib",
            "moonanime",
            "vibix",
            "fancdn",
            "cdnvideohub",
            "vokino",
            "hydraflix",
            "videasy",
            "vidsrc",
            "movpi",
            "vidlink",
            "smashystream",
            "autoembed",
            "pidtor",
            "videoseed",
            "iptvonline",
            "veoveo",
            "kinoflix",
            "leproduction",
            "vkmovie",
            "videoseed",
            "veoveo",
            "kinogo",
            "kinobase",
            "fancdn",
            "asiage",
            "geosaitebi",
            "mikai",
            "dreamerscast"
        ];
      balansers_sync.forEach(function(name) {
        Lampa.Storage.sync('online_choice_' + name, 'object_object');
      });
      Lampa.Storage.sync('online_watched_last', 'object_object');
    }
  }
  if (!window.showy_lampac_plugin) startPlugin();

})();

/* BEGIN LAMPAC VOICE PRIORITY V1 */
(function () {
  'use strict';

  var INSTALL_MARKER = '__lampacVoicePriorityV1';
  var RETRY_LIMIT = 120;
  var retryCount = 0;

  function normalize(value) {
    return String(value || '')
      .toLowerCase()
      .replace(/ё/g, 'е')
      .replace(/&(?:nbsp|amp);/g, ' ')
      .replace(/[^a-zа-я0-9]+/g, ' ')
      .replace(/^\s+|\s+$/g, '')
      .replace(/\s+/g, ' ');
  }

  function compact(value) {
    return normalize(value).replace(/\s+/g, '');
  }

  function voiceRank(title) {
    var normalized = normalize(title);
    var joined = compact(title);

    // Explicitly ad-heavy studios always go below neutral entries.
    if (
      joined.indexOf('coldfilm') !== -1 ||
      joined.indexOf('колдфильм') !== -1 ||
      joined.indexOf('rudub') !== -1 ||
      joined.indexOf('рудуб') !== -1 ||
      joined.indexOf('рудаб') !== -1 ||
      joined.indexOf('ultradox') !== -1 ||
      joined.indexOf('ультрадокс') !== -1
    ) {
      return 1000;
    }

    if (joined.indexOf('lostfilm') !== -1 || joined.indexOf('лостфильм') !== -1) return 0;
    if (joined.indexOf('hdrezka') !== -1 || joined.indexOf('хдрезка') !== -1) return 10;
    if (joined.indexOf('tvshows') !== -1 || joined.indexOf('твшоус') !== -1) return 20;

    if (
      /(^| )(дубляж|дублированный|дублированная|дублированное|дублировано)( |$)/.test(normalized) ||
      normalized.indexOf('официальный дубляж') !== -1 ||
      normalized.indexOf('полное дублирование') !== -1
    ) {
      return 30;
    }

    return 500;
  }

  function isVoiceMenu(object) {
    if (!object || !Array.isArray(object.items) || object.items.length < 2) return false;

    var title = normalize(object.title);
    return (
      title.indexOf('перевод') !== -1 ||
      title.indexOf('озвуч') !== -1 ||
      title === 'voice' ||
      title.indexOf('translation') !== -1
    );
  }

  function isFixedItem(item) {
    return !item || item.separator || item.reset || item.noenter || typeof item.title !== 'string';
  }

  function sortItems(items) {
    var result = items.slice();
    var positions = [];
    var movable = [];

    for (var i = 0; i < items.length; i++) {
      if (isFixedItem(items[i])) continue;
      positions.push(i);
      movable.push({ item: items[i], position: i, rank: voiceRank(items[i].title) });
    }

    movable.sort(function (left, right) {
      if (left.rank !== right.rank) return left.rank - right.rank;
      return left.position - right.position;
    });

    for (var j = 0; j < positions.length; j++) result[positions[j]] = movable[j].item;
    return result;
  }

  function install() {
    if (!window.Lampa || !Lampa.Select || typeof Lampa.Select.show !== 'function') return false;
    if (Lampa.Select.show[INSTALL_MARKER]) return true;

    var originalShow = Lampa.Select.show;
    var wrappedShow = function (object) {
      try {
        if (isVoiceMenu(object)) object.items = sortItems(object.items);
      } catch (error) {
        if (window.console && console.warn) console.warn('VoicePriority', error);
      }

      return originalShow.call(this, object);
    };

    wrappedShow[INSTALL_MARKER] = true;
    wrappedShow.original = originalShow;
    Lampa.Select.show = wrappedShow;
    window[INSTALL_MARKER] = true;
    return true;
  }

  if (!install()) {
    var timer = setInterval(function () {
      retryCount++;
      if (install() || retryCount >= RETRY_LIMIT) clearInterval(timer);
    }, 250);
  }
})();
/* END LAMPAC VOICE PRIORITY V1 */

/* SHOWY_CONTENT_ANALYTICS_V1 */
(function () {
  'use strict';

  function showyProEuStartContentAnalytics() {
    var apiBase = 'http://87.120.126.125:8001';

    function startRuntime() {
      if (!window.ShowyMarketingRuntime) return;
      window.ShowyMarketingRuntime.start({
        apiBase: apiBase,
        component: 'showy_lampac'
      });
    }

    if (window.ShowyMarketingRuntime) {
      startRuntime();
    } else if (window.Lampa && Lampa.Utils && Lampa.Utils.putScript) {
      Lampa.Utils.putScript(
        [apiBase + '/marketing-runtime.js?v=20260923-link'],
        startRuntime,
        false,
        function () {}
      );
    }
  }

  setTimeout(showyProEuStartContentAnalytics, 0);
})();
