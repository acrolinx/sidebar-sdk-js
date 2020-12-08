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
import { ContentState, Editor, EditorState } from 'draft-js';

interface MyEditorProps {
}

class DraftEditorTestSetup extends React.Component<MyEditorProps, any> {
  editorStyles = {
    'width': '500px',
    'height': '200px',
    'margin': '10px',
    'border': '1px solid gray'
};
  constructor(props: MyEditorProps) {
    super(props);

    this.state = { editorState: EditorState.createWithContent(ContentState.createFromText('This is test content.')) };
    
  }
  handleChange(e: EditorState) {
    this.setState({ editorState: e });
  }

  render() {
    return (
      <div style={this.editorStyles}>
        <Editor editorState={this.state.editorState} onChange={e => this.handleChange(e)} />
      </div>
    );
  }
}

export { DraftEditorTestSetup }
