# Acrolinx Sidebar Demo

Demo code for an integration of the Acrolinx sidebar into a web application

## Prerequisites

Please contact Acrolinx SDK support (sdk-support@acrolinx.com) for initial consulting. 
We like to schedule a kickoff meeting to answer any questions about your integration project. 
After the meeting, we provide you with test server credentials and configuration settings you need to get started.

## Configuration of the sidebar cloud example

Before you can run this example you need to configure some settings in these files:

  * samples/server/cloud/config.js
    * username
    * password
    * clientId
    * clientSecret
  * samples/client/cloud/config.js
    * documentId

## Configuration of the sidebar on premise example

Before you can run this example you need to configure some settings in these files:
  * samples/client/on-premise/example.js
    * clientSignature
    * serverAddress

## How to start
First make sure, that you have installed nodejs (which includes npm) and grunt-cli.

Then you need to install all required node modules:

    npm install

Now you can start the development server by typing:

    grunt

(If grunt complains while the bower:install task, you might have to execute "bower install" manually.)

Now open [http://localhost:9002](http://localhost:9002) in your web-browser.

![Screen Shot of On-Premise Example](/doc/screenshot.png)

If you modify the samples/server/cloud/config.js file, you need to restart the application.

## Sidebar API Documentation

You can find the Sidebar API Documentation as a TypeScript .d.ts file here:  
https://acrolinx-integrations.acrolinx-cloud.com/sidebar/v13/docs/index.html  

## License

Copyright 2015 Acrolinx GmbH

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


