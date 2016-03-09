/*global acrolinxLibs, Q, $, _ */

(function () {
  'use strict';

  var originalAcrolinxLibs = window.acrolinxLibs || {};

  window.acrolinxLibs = {
    Q: originalAcrolinxLibs.Q || window.Q,
    $: originalAcrolinxLibs.$ || window.$,
    _: originalAcrolinxLibs._ || window._
  };

})();