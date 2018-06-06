import {AdapterInterface} from "../../../src/adapters/AdapterInterface";

export type DoneCallback = () => void;
export type InitAdapterCallback = (adapter: AdapterInterface) => void;

export interface AdapterTestSetup {
  name: string;
  editorElement: string;
  inputFormat: string;
  setEditorContent: (text: string, done: DoneCallback) => void;
  init: (done: InitAdapterCallback) => void;
  remove: () => void;
  getSelectedText(): string;
}
