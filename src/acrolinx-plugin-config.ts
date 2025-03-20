import {
  AcrolinxStorage,
  CheckInformationKeyValuePair,
  CheckResult,
  InitParameters,
  InitResult,
  LogEntry,
} from '@acrolinx/sidebar-interface';

export interface AcrolinxPluginConfig extends InitParameters {
  sidebarContainerId: string;
  sidebarUrl?: string;
  sidebarHtml?: string;
  checkSelection?: boolean;
  useMessageAdapter?: boolean;
  useSidebarFromSameOriginDirectly?: boolean;
  onSidebarWindowLoaded?: (sidebarWindow: Window) => void;
  getDocumentReference?: () => string;
  acrolinxStorage?: AcrolinxStorage;
  onEmbedCheckData?: (checkData: CheckInformationKeyValuePair[], format: string) => void;
  onInitFinished?: (initFinishedResult: InitResult) => void;
  onCheckResult?: (checkResult: CheckResult) => void;
  openLogFile?: () => void;
  openWindow?: (url: string) => void;
  log?: (logEntry: LogEntry) => void;
}
