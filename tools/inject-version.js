/*
 * Copyright 2019-present Acrolinx GmbH
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const fs = require('fs');

const FILES = ['dist/acrolinx-plugin.js', 'dist/acrolinx-sidebar-sdk.js'];
const ENCODING = 'utf8';

const packageJson = JSON.parse(fs.readFileSync('package.json'));
const build = process.env.BUILD_NUMBER || 1;

const sdkVersion = packageJson.version + '.' + build;

FILES.forEach(file => {
  const fileContent = fs.readFileSync(file, ENCODING);
  const modifiedFileContent = fileContent.replace('§SIDEBAR_SDK_VERSION', sdkVersion);
  if (fileContent === modifiedFileContent) {
    console.error("Can't find §SIDEBAR_SDK_VERSION in " + file);
    process.exit(1);
  }
  fs.writeFileSync(file, modifiedFileContent, ENCODING);
});
