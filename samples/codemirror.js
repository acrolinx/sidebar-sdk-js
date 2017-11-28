var codeMirrorEditor = CodeMirror.fromTextArea(document.getElementById("editor"), {
  lineNumbers: true
});

var exampleSelector = document.getElementById('exampleSelector');
var documentReferenceInput = document.getElementById('documentReferenceInput');
var selectedExample;

function setupExampleSelector() {
  var options = EXAMPLES.map(function (example, i) {
    return '<option value="'+ i +'">' + example.name + '</option>';
  });
  exampleSelector.innerHTML = options.join('');
  exampleSelector.value = 0;
}

function initSelectedExample() {
  selectedExample = EXAMPLES[exampleSelector.value];
  codeMirrorEditor.setOption('mode', selectedExample.mimeType);
  codeMirrorEditor.setValue(selectedExample.content);

  var documentReferenceSection = document.getElementById('documentReferenceSection');
  if (selectedExample.name === 'Auto') {
    documentReferenceSection.style.display = 'block';
    documentReferenceInput.value = selectedExample.documentReference;
  } else {
    documentReferenceSection.style.display = 'none';
  }

}


function initAcrolinxPlugin() {
  basicConf.checkSelection = true;

  basicConf.getDocumentReference = function () {
    if (selectedExample.name = 'Auto') {
      return documentReferenceInput.value.trim() || window.location.href;
    } else {
      return selectedExample.documentReference;
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

setupExampleSelector();
initSelectedExample();
exampleSelector.addEventListener('change', initSelectedExample);
initAcrolinxPlugin();