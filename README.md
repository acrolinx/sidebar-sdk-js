# Acrolinx Sidebar Demo

Showcase and library for an integration of the [Acrolinx](http://www.acrolinx.com/) sidebar into a web application.
The library contains adapters to use in your web integration. These are ready to use for: Editable divs, input elements and rich text editors like CKEditor and TinyMCE.

## Table of Content

[The Acrolinx Sidebar](#the-acrolinx-sidebar)

[Prerequisites](#prerequisites)

[Setting up the Sidebar Example](#setting-up-the-sidebar-example)

[Getting started with your own integration](#getting-started-with-your-own-integration )

[Sidebar API Documentation](#sidebar-api-documentation)

[License](#license)

## The Acrolinx Sidebar

The Acrolinx sidebar is designed to show up beside the window where you edit your content. 
You use it for checking, reviewing, and correcting your content. For web integrations Acrolinx provides a sidebar hosted in the cloud.
So your integration can always keep up to date with bug fixes and new features.
To get an impression what the sidebar looks like in other integration check the 
[Acrolinx Support Center](https://support.acrolinx.com/hc/en-us/articles/205594781-Acrolinx-Sidebar-Edition-User-Interface-Reference).

## Prerequisites

Please contact Acrolinx SDK support (sdk-support@acrolinx.com) for initial consulting. 
We like to schedule a kickoff meeting to answer any questions about your integration project. 
After the meeting, we provide you with test server credentials and configuration settings you need to get started.

Please note that this an example for a integration into a web application only. 
Acrolinx offers different other SDKs for developing integrations. 

Before you start developing your own integration, you might benefit from looking into the sidebar example.

## Setting up the Sidebar Example

### using nodejs and grunt-cli

1. After check out, make sure, that you have installed nodejs (which includes npm) and grunt-cli.

2. Install all required node modules with:

    ```
        npm install
    ```

3. Before you can run this example, you need to configure some settings in the [config.js](/samples/config.js). 
   Please fill in `clientSignature` and `serverAdress` with the values that were provided by Acrolinx (after your kickoff meeting).
   Note that this sample will only connect to Acrolinx Servers using HTTPS and having [CORS](https://en.wikipedia.org/wiki/Cross-origin_resource_sharing) enabled.

4. Now you can start the development server by typing:
  
   ```
       grunt
   ```
   
   (If grunt complains while the bower:install task, you might have to execute "bower install" manually.)
   
   Now open [http://localhost:9002](http://localhost:9002) in your web-browser.
   
   ![Screen Shot of Example](/doc/screenshot.png)
   
Within the sample client you can see how the sidebar interacts with different editors.
There are adapters for simple editable divs, input elements and rich text editors like CKEditor and TinyMCE ready to go.
You're integration can use these adapters and you'll won't have any headache about that.
  

## Getting started with your own integration 

The requirements to achieve this are:
* a mechanism and a container that can display the Acrolinx sidebar (usually JavaScript plugin mechanism)
* a mechanism that allows the sidebar to retrieve the text to be checked
* a mechanism that will allow the sidebar to replace specific parts of the text

All of the above are required by the Acrolinx Sidebar API and need to be provided by the Integration Developer. 
However Acrolinx provides some reference integrations with TinyMCE and CKEditor.


## Sidebar API Documentation

For now check the [sidebar plugin interface](src/acrolinx-libs/plugin-interfaces.ts).

## License

Copyright 2015-2016 Acrolinx GmbH

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

For more information visit: http://www.acrolinx.com

[back to top](#table-of-content)


