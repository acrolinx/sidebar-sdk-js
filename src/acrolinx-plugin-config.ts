/*
 * Copyright 2025-present Acrolinx GmbH
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
