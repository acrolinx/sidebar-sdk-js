/*
 *
 * * Copyright 2016 Acrolinx GmbH
 * *
 * * Licensed under the Apache License, Version 2.0 (the "License");
 * * you may not use this file except in compliance with the License.
 * * You may obtain a copy of the License at
 * *
 * * http://www.apache.org/licenses/LICENSE-2.0
 * *
 * * Unless required by applicable law or agreed to in writing, software
 * * distributed under the License is distributed on an "AS IS" BASIS,
 * * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * * See the License for the specific language governing permissions and
 * * limitations under the License.
 * *
 * * For more information visit: http://www.acrolinx.com
 *
 */

namespace acrolinxLibs {
  'use strict';
  import LoDashStatic = _.LoDashStatic;

  const windowWithLibs: any = window;
  const originalAcrolinxLibs = windowWithLibs['acrolinxLibs'] || {};
  export const Q = originalAcrolinxLibs.Q || windowWithLibs['Q'];
  export const _: LoDashStatic =  originalAcrolinxLibs._ || windowWithLibs['_'];
}


