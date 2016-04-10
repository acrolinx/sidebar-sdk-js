/*global acrolinxLibs, Q, $, _ */


namespace acrolinxLibs {
  'use strict';
  import LoDashStatic = _.LoDashStatic;

  const windowWithLibs: any = window;
  const originalAcrolinxLibs = windowWithLibs['acrolinxLibs'] || {};
  export const Q = originalAcrolinxLibs.Q || windowWithLibs['Q'];
  export const $: JQueryStatic = originalAcrolinxLibs.$ || windowWithLibs['$'];
  export const _ : LoDashStatic =  originalAcrolinxLibs._ || windowWithLibs['_'];
}


