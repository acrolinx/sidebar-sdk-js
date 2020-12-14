/*
 * Copyright 2020-present Acrolinx GmbH
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

import * as React from 'react';
import { ContentState, convertToRaw, Editor, EditorState } from 'draft-js';

class DraftEditorTestSetup extends React.Component {
  editorStyles = {
    'width': '200px',
    'margin': '10px',
    'border': '1px solid gray'
  };
  onChange: (editorState: any) => void;
  setEditor: (editor: any) => void;
  editor: any;
  focusEditor: () => void;
  constructor(props: any) {
    super(props);

    this.state = {
      editorState: EditorState.createWithContent(ContentState.createFromText('This is test conteent.'))
    };
    this.onChange = (editorState) => {
      this.setState({ editorState })
    };
    this.setEditor = (editor) => {
      this.editor = editor;
    };
    this.focusEditor = () => {
      if (this.editor) {
        this.editor.focus();
      }
    };
  }

  componentDidMount() {
    this.focusEditor();
  }

  getContentAsRawJson() {
    const contentState = (this.state as any).editorState.getCurrentContent();
    const raw = convertToRaw(contentState);

    return JSON.stringify(raw, null, 2);
  }

  getSelectionText() {
    const selectionState = (this.state as any).editorState.getSelection();
    const anchorKey = selectionState.getAnchorKey();
    const currentContent = (this.state as any).editorState.getCurrentContent();
    const currentContentBlock = currentContent.getBlockForKey(anchorKey);
    const start = selectionState.getStartOffset();
    const end = selectionState.getEndOffset();
    const selectedText = currentContentBlock.getText().slice(start, end);

    return selectedText;
  }

  render() {
    return (
      <div>
        <div id='editorId' style={this.editorStyles} onClick={this.focusEditor}>

          <Editor
            ref={this.setEditor}
            editorState={(this.state as any).editorState}
            onChange={this.onChange}
          />
        </div>
        <div id='selection'>
          <pre>
            {this.getSelectionText()}
          </pre>
        </div>
      </div>

    );
  }
}

export { DraftEditorTestSetup };
