var EXAMPLES = [];
var query = parseQuery(window.location.search);
var indexUrl = query.documentIndex || 'test-documents/index.json';
var exampleSelector = document.getElementById('exampleSelector');
var documentReferenceInput = document.getElementById('documentReferenceInput');
var selectedExample;

var codeMirrorEditor = CodeMirror.fromTextArea(document.getElementById("editor"), {
  lineNumbers: true
});

function setupExampleSelector() {
  var options = EXAMPLES.map(function (example, i) {
    return '<option value="' + i + '">' + example.name + '</option>';
  });
  exampleSelector.innerHTML = options.join('');
  exampleSelector.value = query.selected ||  0;
}

function initSelectedExample() {
  selectedExample = EXAMPLES[exampleSelector.value];
  var urlBase = indexUrl.replace(/[^\/]*$/, '');
  jQuery.get(urlBase + selectedExample.path).done(function (_documentContent, _status, xhr) {
    codeMirrorEditor.setOption('mode', selectedExample.mimeType);
    codeMirrorEditor.setValue(xhr.responseText);

    var documentReferenceSection = document.getElementById('documentReferenceSection');
    if (isAutoExampleSelected()) {
      documentReferenceSection.style.display = 'block';
      documentReferenceInput.value = selectedExample.path;
    } else {
      documentReferenceSection.style.display = 'none';
    }
  });
}

function initAcrolinxPlugin() {
  basicConf.checkSelection = true;

  basicConf.getDocumentReference = function () {
    if (isAutoExampleSelected()) {
      return documentReferenceInput.value.trim() || window.location.href;
    } else {
      return selectedExample.path;
    }
  };

  // Create the main Acrolinx plugin.
  var acrolinxPlugin = new acrolinx.plugins.AcrolinxPlugin(basicConf);

  // Create an adapter for a text area.
  var adapter = new acrolinx.plugins.adapter.CodeMirrorAdapter({editor: codeMirrorEditor});

  // Register the single adapter to the main Acrolinx plugin.
  acrolinxPlugin.registerAdapter(adapter);

  acrolinxPlugin.init();
}

function isAutoExampleSelected() {
  return selectedExample.name === 'Auto';
}

function parseQuery(search) {
  var query = search.substr(1);
  var result = {};
  query.split("&").forEach(function (part) {
    var item = part.split("=");
    result[item[0]] = decodeURIComponent(item[1]);
  });
  return result;
}

function init() {
  jQuery.get(indexUrl).done(function (_result, _status, xhr) {
    var result = JSON.parse(xhr.responseText);
    EXAMPLES = result.documents;
    setupExampleSelector();
    initSelectedExample();
    exampleSelector.addEventListener('change', initSelectedExample);
    initAcrolinxPlugin();
  });
}

init();

