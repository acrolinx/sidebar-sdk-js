import { AdapterInterface } from '../../../src/adapters/adapter-interface';

export type DoneCallback = () => void;

export interface AdapterTestSetup {
  name: string;
  editorElement: string;
  inputFormat: string;
  setEditorContent: (text: string) => void;
  init: () => Promise<AdapterInterface>;
  remove: () => void | Promise<void>;
  getSelectedText(): string;
}
