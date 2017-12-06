export type DoneCallback = () => void;

export interface AdapterTestSetup {
  name: string;
  editorElement: string;
  inputFormat: string;
  setEditorContent: (text: string, done: DoneCallback) => void;
  init?: (done: DoneCallback) => void;
  editor?: any;
  createAdapterConf?: () => any;
  remove: () => void;
  inputEventWasTriggered?: boolean;
}
