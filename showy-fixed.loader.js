(function () {
  'use strict';

  var script = document.currentScript;
  if (!script) {
    var scripts = document.getElementsByTagName('script');
    script = scripts[scripts.length - 1];
  }

  var src = (script && script.src) ? script.src : '';
  var base = src.replace(/[^/]*$/, '');
  if (!base) return;

  Lampa.Utils.putScriptAsync([base + 'showy-fixed.js?v=' + Date.now()], function () {});
})();
