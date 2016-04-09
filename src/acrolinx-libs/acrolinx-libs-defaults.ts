/*global acrolinxLibs, Q, $, _ */


namespace acrolinxLibs {
  'use strict';

  const windowWithLibs: any = window;
  const originalAcrolinxLibs = windowWithLibs['acrolinxLibs'] || {};
  export const Q = originalAcrolinxLibs.Q || windowWithLibs['Q'];
  export  const $ = originalAcrolinxLibs.$ || windowWithLibs['$'];
  export const _ =  originalAcrolinxLibs._ || windowWithLibs['_'];
}


