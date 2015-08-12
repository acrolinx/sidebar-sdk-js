/*
 *
 * * Copyright 2015 Acrolinx GmbH
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

/*global rangy */

(function () {
  'use strict';

  var CLIENT_COMPONENTS = [
    {
      id: 'com.acrolinx.sidebarexample',
      name: 'Acrolinx Sidebar Example Client',
      version: '1.2.3.999',
      category: 'MAIN'
    }
  ];


  function initAcrolinxSamplePlugin(config) {
    var currentHtmlChecking;
    var lastCheckedHtml;
    var $sidebarContainer = $('#' + config.sidebarContainerId);
    var $sidebar = $('<iframe></iframe>');
    $sidebarContainer.append($sidebar);
    var sidebarContentWindow = $sidebar.get(0).contentWindow;

    function getEditor() {
      return document.getElementById(config.editorId);
    }

    function getEditorElement() {
      return getEditor();
    }

    function getCurrentText() {
      return rangy.innerText(getEditorElement());
    }

    function getHTML() {
      return getEditor().innerHTML;
    }


    function selectText(begin, length) {
      /*
       * The DOM does not allow you to select text with offsets easily, but Rangy provides an implementation for that.
       * If you run into performance problems you should use another implementation.
       */
      var editorElement = getEditorElement();
      var r = rangy.createRange();
      r.setStart(editorElement, 0);
      r.setEnd(editorElement, 0);
      r.moveStart('character', begin);
      r.moveEnd('character', length);
      var sel = rangy.getSelection();
      sel.setSingleRange(r);
    }


    function findRangesPositionInPlainText(text, matches) {
      /*
       Be aware that matches can be discontinuous. Check if(matches[i].range[1] == matches[i+1].range[0]).
       An implementation for production use should store the last checked document content in a variable and look up the range offsets in the original document.
       Afterwards, it should map these offsets to the actual offsets of document. Due to changes in the document, the offsets might differ.
       */
      var rangesText = matches.map(function (match) {
        return match.content;
      }).join('');
      var indexOfRangesText = text.indexOf(rangesText);
      if (indexOfRangesText > -1) {
        return {
          start: indexOfRangesText,
          length: rangesText.length
        };
      } else {
        return null;
      }
    }


    function onSidebarLoaded () {
      function initSidebarCloud() {
        config.requestAccessTokenCallback(function (accessToken) {
          sidebarContentWindow.acrolinxSidebar.init({
            clientComponents: CLIENT_COMPONENTS,
            token: accessToken,
            contentPieceUuid: config.documentId,
            integrationFacadeBaseUrl: config.integrationFacadeBaseUrl

            //checkSettings: {
            //  'language': 'en',
            //  'ruleSetName': 'Plain English',
            //  'termSets': ['Medical'],
            //  'checkSpelling': true,
            //  'checkGrammar': true,
            //  'checkStyle': true,
            //  'checkReuse': false,
            //  'harvestTerms': false,
            //  'checkSeo': false,
            //  'termStatuses': ['TERMINOLOGY_DEPRECATED']
            //}

            //defaultCheckSettings: {
            //  'language': 'en',
            //  'ruleSetName': 'Plain English',
            //  'termSets': ['Medical'],
            //  'checkSpelling': true,
            //  'checkGrammar': true,
            //  'checkStyle': true,
            //  'checkReuse': false,
            //  'harvestTerms': false,
            //  'checkSeo': false,
            //  'termStatuses': ['TERMINOLOGY_DEPRECATED']
            //}

          });
        });
      }

      function initSidebarOnPremise() {
        sidebarContentWindow.acrolinxSidebar.init({
          clientComponents: CLIENT_COMPONENTS,
          clientSignature: config.clientSignature,
          showServerSelector: true,
          serverAddress: config.serverAddress
        });
      }

      console.log('Install acrolinxPlugin in sidebar.');
      sidebarContentWindow.acrolinxPlugin = {

        requestInit: function () {
          console.log('requestInit');
          if (config.sidebarType === 'CLOUD') {
            initSidebarCloud();
          } else {
            initSidebarOnPremise();
          }
        },

        onInitFinished: function (initFinishedResult) {
          console.log('onInitFinished: ', initFinishedResult);
          if (initFinishedResult.error) {
            window.alert(initFinishedResult.error.message);
          }
        },

        configure: function (configuration) {
          console.log('configure: ', configuration);
        },

        requestAccessToken: function () {
          var requestAccessTokenCallback = config.requestAccessTokenCallback;
          if (requestAccessTokenCallback) {
            requestAccessTokenCallback(function (accessToken) {
              sidebarContentWindow.acrolinxSidebar.setAccessToken(accessToken);
            });
          }
        },

        requestGlobalCheck: function () {
          console.log('requestGlobalCheck');
          var html = getHTML().trim();
          var checkInfo = sidebarContentWindow.acrolinxSidebar.checkGlobal(html, {
            inputFormat: 'HTML',
            requestDescription: {
              documentReference: 'filename.html'
            }
          });
          console.log('Got checkId:', checkInfo.checkId);
          currentHtmlChecking = html;
        },

        onCheckResult: function (checkResult) {
          console.log('onCheckResult: ', checkResult);
          lastCheckedHtml = currentHtmlChecking;
          return [];
        },

        selectRanges: function (checkId, matches) {
          console.log('selectRanges: ', checkId, matches);
          var positionInPlainText = findRangesPositionInPlainText(getCurrentText(), matches);
          if (positionInPlainText) {
            selectText(positionInPlainText.start, positionInPlainText.length);
            // In a complete plugin we should also scroll to the selected text.
          } else {
            window.alert('Sorry, but I can\'t select this issue.');
          }
        },

        replaceRanges: function (checkId, matchesWithReplacement) {
          console.log('replaceRanges: ', checkId, matchesWithReplacement);
          this.selectRanges(checkId, matchesWithReplacement);
          var replacementText = matchesWithReplacement.map(function (matcheWithReplacement) {
            return matcheWithReplacement.replacement;
          }).join('');
          var sel = rangy.getSelection();
          var range = sel.getRangeAt(0);
          range.deleteContents();
          var node = range.createContextualFragment(replacementText);
          range.insertNode(node);
        },

        // only needed for local checks
        getRangesOrder: function (checkedDocumentRanges) {
          console.log('getRangesOrder: ', checkedDocumentRanges);
          return [];
        },

        download: function (download) {
          console.log('download: ', download.url, download);
          window.open(download.url);
        },

        // only needed for local checks
        verifyRanges: function (checkedDocumentParts) {
          console.log('verifyRanges: ', checkedDocumentParts);
          return [];
        },

        disposeCheck: function (checkId) {
          console.log('disposeCheck: ', checkId);
        }
      };
    }

    function loadSidebarIntoIFrame() {
      var sidebarBaseUrl = config.sidebarType === 'CLOUD'?
        'https://acrolinx-integrations.acrolinx-cloud.com/sidebar/v13/' :
        'https://acrolinx-sidebar-classic.s3.amazonaws.com/v13/prod/';
      return $.ajax({
        url: sidebarBaseUrl + 'index.html',
      }).then(function (sidebarHtml) {
        var sidebarHtmlWithAbsoluteLinks = sidebarHtml
          .replace(/src="/g, 'src="' + sidebarBaseUrl)
          .replace(/href="/g, 'href="' + sidebarBaseUrl);
        sidebarContentWindow.document.open();
        sidebarContentWindow.document.write(sidebarHtmlWithAbsoluteLinks);
        sidebarContentWindow.document.close();
        onSidebarLoaded();
      });
    }

    loadSidebarIntoIFrame();
  }

  window.initAcrolinxSamplePlugin = initAcrolinxSamplePlugin;

})();


