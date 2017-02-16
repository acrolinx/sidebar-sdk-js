# Acrolinx Sidebar Demo

Showcase and library for an integration of the [Acrolinx](http://www.acrolinx.com/) sidebar into a web application.
The library contains adapters to use in your web integration. These are ready to use for: Editable divs, input elements and rich text editors like CKEditor and TinyMCE.

## Live Demo

[Acrolinx Sidebar Live Demo](https://cdn.rawgit.com/acrolinx/acrolinx-sidebar-demo/3eae2725d5471494affab6abc4af87fad3bb4fc5/samples/index.html)

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

Please contact Acrolinx SDK support (sdk-support@acrolinx.com) for consulting and getting your integration certified.
This sample works with a test license on an internal acrolinx server. This license is only meant for demonstration and developing purposes.
Once you finished your integration you'll have to get a license for your integration from Acrolinx.
  
Please note that this an example for a integration into a web application only. 
Acrolinx offers different other SDKs for developing integrations. 

Before you start developing your own integration, you might benefit from looking into the sidebar example.

## Setting up the Sidebar Example

### using nodejs and grunt-cli

1. Make sure that git is in your PATH variable. You can verify that running 

    ```
    git
    ```

    in your console. If the command wasn't found, git is not in in your system's PATH variable.

2. After check out, make sure, that you have installed nodejs (which includes npm).

3. Install grunt-cli with

    ```
    npm install -g grunt-cli
    ```

4. In your console navigate into the projects root folder and install all required node modules with:

    ```
        npm install
    ```

5. Now you can start the development server by typing:
  
   ```
       grunt
   ```
   
   (If grunt complains while the bower:install task, you might have to execute "bower install" manually.)
   
   Now open [http://localhost:9002](http://localhost:9002) in your web-browser. Choose the sample, that you want to see.
   You will see sidebars login page. If not already pre-filled type 'http://integration.acrolinx.com:8031' as the server 
   address and choose a username and a password to login. 
   
   ![Screen Shot of Example](/doc/screenshot.png)
   
Within the sample client you can see how the sidebar interacts with different editors.
There are adapters for simple editable divs, input elements and rich text editors like CKEditor and TinyMCE ready to go.
You're integration can use these adapters and you'll won't have any headache about that.

[back to top](#table-of-content)

## Getting started with your own integration 

The requirements to achieve this are:
* a mechanism and a container that can display the Acrolinx sidebar (usually JavaScript plugin mechanism)
* a mechanism that allows the sidebar to retrieve the text to be checked
* a mechanism that will allow the sidebar to replace specific parts of the text

All of the above are required by the Acrolinx Sidebar API and need to be provided by your integration. 
However Acrolinx provides some reference integrations with TinyMCE and CKEditor.

Let's take a look at how the sidebar is loaded and the typical interactions with an integration.

### Loading

1. Load your host editor and your integration code.
 
2. Register your integration as an Acrolinx Plugin (Check the API Documentation for the Acrolinx Plugin Interface.) 
 You'll find the API Documentation [here](https://cdn.rawgit.com/acrolinx/acrolinx-sidebar-demo/v0.3.37/doc/pluginDoc/modules/_plugin_interfaces_.html).
 ```
 var acrolinxPlugin = {...}
 ```
3. Load the sidebar and the referenced libraries code (usually sidebar.js, libs.js, sidebar.css).

### Initializing

1. Once the sidebar has finished loading it will request the integration 
to initialize by calling `requestInit`.
 
2. The AcrolinxPlugin now must call `init`.
 
3. Once the init process has finished, the plug-in will be notified `onInitFinished`.
 
4. After initializing the sidebar will call `configure` and push the latest
 configuration to the plug-in.
 
 ![Initializing plug-in and sidebar](/doc/initSidebarPlugin.png)
 
You'll find the API Documentation [here](https://cdn.rawgit.com/acrolinx/acrolinx-sidebar-demo/v0.3.37/doc/pluginDoc/modules/_plugin_interfaces_.html).

### Checking

1. If the user pushes the button "Check" (in the Acrolinx sidebar), `requestGlobalCheck` is called.
 
2. The acrolinxPlugin must call `checkGlobal` to perform a check.

3. When the check finished, `onCheckResult` is called and the sidebar displays cards for the issues.

![Checking with plug-in and sidebar](/doc/checking.png)
 
### Other actions

- When the user clicks on a card the sidebar will invoke `selectRanges` on the plugin.
- When the user clicks on a replacement the sidebar will call `replaceRanges`.

These are the most important interactions between the Acrolinx sidebar and your integration. 
Please check the [sidebar plugin API](https://cdn.rawgit.com/acrolinx/acrolinx-sidebar-demo/v0.3.37/doc/pluginDoc/modules/_plugin_interfaces_.html) for more information.

[back to top](#table-of-content)

## Sidebar API Documentation

Check our [sidebar plugin API](https://cdn.rawgit.com/acrolinx/acrolinx-sidebar-demo/v0.3.37/doc/pluginDoc/modules/_plugin_interfaces_.html).

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


