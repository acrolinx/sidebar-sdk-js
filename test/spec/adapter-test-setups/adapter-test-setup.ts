import {AdapterInterface} from "../../../src/adapters/AdapterInterface";

export type DoneCallback = () => void;

export interface AdapterTestSetup {
  name: string;
  editorElement: string;
  inputFormat: string;
  setEditorContent: (text: string, done: DoneCallback) => void;
  init: () => Promise<AdapterInterface>;
  remove: () => void;
  getSelectedText(): string;
}
