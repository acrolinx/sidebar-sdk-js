# Acrolinx Sidebar SDK JS

[![Continuous Integration Sidebar SDK JS](https://github.com/acrolinx/sidebar-sdk-js/actions/workflows/build.yml/badge.svg)](https://github.com/acrolinx/sidebar-sdk-js/actions/workflows/build.yml)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=acrolinx_sidebar-sdk-js&metric=alert_status)](https://sonarcloud.io/dashboard?id=acrolinx_sidebar-sdk-js)

This is a library for integrating the [Acrolinx](https://www.acrolinx.com/) Sidebar into a web application.

See: [Build With Acrolinx](https://support.acrolinx.com/hc/en-us/categories/10209837818770-Build-With-Acrolinx)

## Live Demo

[Acrolinx Sidebar Web Live Demo](https://acrolinx.github.io/acrolinx-sidebar-demo/samples/index.html)

## Examples

[Acrolinx Sidebar Web Demo](https://github.com/acrolinx/acrolinx-sidebar-demo)

## The Acrolinx Sidebar

The Acrolinx Sidebar is designed to show up beside the window where you edit your content.
You use it for checking, reviewing, and correcting your content.
To get an impression what the Sidebar looks like in existing integrations, have a look at
[Sidebar Quick Start](https://support.acrolinx.com/hc/en-us/articles/10252588984594-Sidebar-Quick-Start).

## Prerequisites

Please contact [Acrolinx SDK support](https://github.com/acrolinx/acrolinx-coding-guidance/blob/master/topics/sdk-support.md)
for consulting and getting your integration certified.
This sample works with a test license on an internal Acrolinx URL.
This license is only meant for demonstration and developing purposes.
Once you finished your integration, you'll have to get a license for your integration from Acrolinx.

Acrolinx offers different other SDKs, and examples for developing integrations.

Before you start developing your own integration, you might benefit from looking into:

- [Build With Acrolinx](https://support.acrolinx.com/hc/en-us/categories/10209837818770-Build-With-Acrolinx),
- the [Guidance for the Development of Acrolinx Integrations](https://github.com/acrolinx/acrolinx-coding-guidance),
- the [Acrolinx SDKs](https://github.com/acrolinx?q=sdk), and
- the [Acrolinx Demo Projects](https://github.com/acrolinx?q=demo).

## Getting Started

### Installation

To install the SDK to your npm-based Acrolinx Integration project call:

```bash
npm install @acrolinx/sidebar-sdk
```

### Instructions for Contributing Code

[CONTRIBUTING.md](CONTRIBUTING.md)

## SDK Features

The SDK provides [adapters](https://acrolinx.github.io/sidebar-sdk-js/pluginDoc/interfaces/AdapterInterface.html) for:

- `contentEditable` `div`-elements,
- `input` text elements,
- CodeMirror,
- CKEditor,
- Xeditor,
- TinyMCE, and a
- `MultiEditorAdapter` that can be used to combine different adapters as one document.

If you need to support other editors, sometimes the `ContentEditableAdapter` works without any changes.
If not, implement the [`AdapterInterface`](https://acrolinx.github.io/sidebar-sdk-js/pluginDoc/modules/adapters_adapterinterface.html).

### Deprecation

> :warning: **Sidebar v14 is getting deprecated**

The process to update your existing integration is straightforward and involves the following steps:

1. Update to the Latest SDK Version: Please ensure that you’ve updated to the latest SDK version. The most recent version can be found on our NPM package page [here](https://www.npmjs.com/package/@acrolinx/sidebar-sdk).
2. Remove the Initialization Config (Optional): If your current implementation includes the initialization config `minimumSidebarVersion=14.x.x`, we recommend removing this configuration.

## References

- The [Sidebar DEMO JS](https://github.com/acrolinx/acrolinx-sidebar-demo) is built based on this SDK.
  - Boilerplate [sample](https://github.com/acrolinx/acrolinx-sidebar-demo/tree/main/samples/boilerplate)
- The Sidebar SDKs are based on the [Acrolinx Sidebar Interface](https://acrolinx.github.io/sidebar-interface/).

## Running This Project

- Make sure you have a Chrome or chromium version later than 72.0.0. This is needed to execute the tests successfully.
- Run `npm i`
- Run `npm run build` to run all tests and build distribution

## Serve Tests for Development

- Run 'npm run test'
- Browser with ViTest running will open

## License

Copyright 2015-present Acrolinx GmbH

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at:

[http://www.apache.org/licenses/LICENSE-2.0](http://www.apache.org/licenses/LICENSE-2.0)

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

For more information visit: [https://www.acrolinx.com](https://www.acrolinx.com)
