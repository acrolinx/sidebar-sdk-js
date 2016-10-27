/**
 * This document describes the interface of the Acrolinx Sidebar.
 *
 * Let's understand how the typical bootstrapping of an integration and the Acrolinx Sidebar works:
 *
 * 1) Load the host editor of your integration.
 *
 * 2) Load your integration code.
 *
 * 3) Register your integration as an AcrolinxPlugin.
 *  ```
 *  var acrolinxPlugin = {...}
 *  ```
 *  Check the {@link AcrolinxPlugin} interface for required methods, that you have to implement.
 *
 * 4) Load the sidebar and the referenced libraries code (usually sidebar.js, libs.js, sidebar.css).
 *
 * 5) Once the sidebar has finished loading it will request the integration to initialize by calling
 *    {@link AcrolinxPlugin.requestInit|requestInit}.
 *
 * 6) The AcrolinxPlugin now must call {@link AcrolinxSidebar.init|init}.
 *
 * 7) Once the init process has finished, the plug-in will be notified:
 *    {@link AcrolinxPlugin.onInitFinished|onInitFinished}.
 *
 * 8) After initializing the sidebar will call {@link AcrolinxPlugin.configure|configure} and push the latest
 * configuration to the plug-in.
 *
 * 9) If the user pushes the button "Check", {@link AcrolinxPlugin.requestGlobalCheck|requestGlobalCheck} is called.
 *
 * 10) The acrolinxPlugin must call {@link AcrolinxSidebar.checkGlobal|checkGlobal} to perform a check.
 *
 * 11) When the check finished, {@link AcrolinxPlugin.onCheckResult|onCheckResult} is called and the sidebar displays
 * cards for the issues.
 *
 * 12) If the user clicks a card {@link AcrolinxPlugin.selectRanges|selectRanges} is called
 *
 * 13) When the user selects a replacement {@link AcrolinxPlugin.replaceRanges|replaceRanges} is called.
 *
 * For a minimal integration (not feature complete) you must implement {@link requestInit}, {@link requestGlobalCheck},
 * {@link configure},
 *   {@link selectRanges}, {@link replaceRanges} and {@link download}.
 */

export interface SidebarConfiguration {
  /**
   * This setting will render cards with suggestions in read-only mode. This means the sidebar won't trigger suggestion
   * replacements in the document. The cards will still work for navigation.
   */
  readOnlySuggestions?: boolean;
}

/**
 *
 * @interface InitParameters
 */
export interface InitParameters extends SidebarConfiguration {

  /**
   * These provide information about your integration and other client software components to display them
   * in the sidebars about dialog. In addition they are used for analytics.
   *
   * They should include information about your plugin and can contain additional libraries or components you are using
   * in your integration. For details check {@link SoftwareComponent}.
   */
  clientComponents?: SoftwareComponent[];

  /**
   *
   * The client locale should be equal to or start with "en", "de", "fr", "sv" or "ja". By default it is set to "en".
   */
  clientLocale?: string;

  /**
   *  The integration specific clientSignature. To get one, ask your Acrolinx contact. It is used to register and
   *  identify your plugin.
   *
   */
  clientSignature?: string;

  /**
   * By default value of this property is ''. That means the base URL of the host that your plugin runs from.
   * If your Acrolinx Server runs on a different host, you have to put the address here.
   */
  serverAddress?: string;

  /**
   * This property enables the user to manually change the serverAddress on the log-in screen.
   */
  showServerSelector?: boolean;

  /**
   * With this property you can define check settings that will apply to all triggered checks.
   * This settings will overwrite the saved settings of the user.
   */
  checkSettings?: CheckSettings;

  /**
   * This settings will be used as initial default settings when the user uses the sidebar for the first time.
   * If checkSettings is defined then the defaultCheckSettings will be ignored.
   */
  defaultCheckSettings?: CheckSettings;

  /**
   * If your Acrolinx Server is configured to support single sign on, you have to set this property to true in order to
   * enable single sign on from your integration.
   */
  enableSingleSignOn?: boolean;

  /**
   * This setting will prevent any connection with an Acrolinx Server via other than HTTPS protocol.
   */
  enforceHTTPS?: boolean;

}

/**
 * These are the settings used, when checking text.
 */
export interface CheckSettings {
  language: string;
  ruleSetName: string;
  termSets: string[];
  checkSpelling: boolean;
  checkGrammar: boolean;
  checkStyle: boolean;
  checkReuse: boolean;
  harvestTerms: boolean;
  checkSeo: boolean;
  termStatuses: string[];
}

/**
 * Provide information about your integration and other client software components for the about dialog and
 * analytics.
 */
export interface SoftwareComponent {
  /**
   * The id of the software component.
   * Examples: 'com.acrolinx.win.word.32bit', 'com.acrolinx.mac.word'
   */
  id: string;

  /**
   * The name if the software component.
   * This name will be displayed in the sidebars about dialog.
   */
  name: string;

  /**
   * The version of the software component.
   * @format: ${major}.${minor}.${patch}.${buildNumber}
   * @example: '1.2.3.574'
   */
  version: string;

  /**
   * Check {@link SoftwareComponentCategory} to choose the right value for your component.
   * By default value this value will be set to 'DEFAULT'.
   * @type SoftwareComponentCategory
   */
  category?: string;
}


export const SoftwareComponentCategory = {
  /**
   * There should be exactly one MAIN component.
   * This information is used to identify your client on the server.
   * Version information about this components might be displayed more prominently.
   */
  MAIN: 'MAIN',

  /**
   * Version information about such components are displayed in the about
   * dialog.
   */
  DEFAULT: 'DEFAULT',

  /**
   * Version information about such components are displayed in the detail section of the about
   * dialog or not at all.
   */
  DETAIL: 'DETAIL'
};

/**
 * Check options describe how the server should handle the checked document.
 */
export interface CheckOptions {
  /**
   * Valid formats are:
   * XML, HTML, TEXT, WORD_XML
   */
  inputFormat?: string;

  /**
   * Set this to true, if the documents content is base64 encoded and gzipped.
   *
   * Note that you only can set this setting and encode and compress your document content, if the sidebar supports this
   * function. Check {@link AcrolinxPluginConfiguration.supported} which is pushed
   * via {@link AcrolinxPlugin.configure}.
   */
  base64EncodedGzipped?: boolean;

  requestDescription?: {
    /**
     * Usually the path and file name. In a CMS it could be the id, which can be used to
     * lookup the document.
     */
    documentReference?: string;
  };
}


/**
 * Each {@link checkGlobal} call will return an unique id, which helps the plugin to map results,
 * selection, and replacement requests to the corresponding checked document. This is necessary, because the returned
 * offsets are only valid for the document at a specific point in time. All changes made to the document after the
 * check call will make the offsets invalid. That's why you should to store the submitted document contents
 * together with its check ids in a map.
 */
export interface Check {
  checkId: string;
}


/**
 * After a check the sidebar will tell the plug-in which parts of the document had been checked.
 */
export interface CheckResult {
  /**
   * The part of the document which was checked by the server. If the server recognizes that parts of the document
   * are missing, only valid parts will be checked.
   */
  checkedPart: CheckedDocumentPart;
  /**
   * If an error occurs during the check the error object will be set.
   */
  error?: CheckError;
}


/**
 * CheckedDocumentPart describes a part of a previously checked document. All range offsets are only valid to that
 * specific document belonging that check id.
 */
export interface CheckedDocumentPart {
  /**
   * The id of the check where the document part belongs to.
   *
   */
  checkId: string;

  /**
   *  A range are two numbers: A start offset and an end offset.
   */
  range: [number, number];
}


export type InvalidDocumentPart = CheckedDocumentPart;
export type CheckedDocumentRange = CheckedDocumentPart


export interface Match {
  content: string;

  /**
   *  A range are two numbers: A start offset and an end offset.
   */
  range: [number, number];

  /**
   * Available since the 5.0 server.
   */
  extractedRange?: [number, number];
}


/**
 * Content and offsets belonging to a previous performed check, which must be replaced by the replacement.
 * The offsets of the matches are only valid to the unchanged document content, which was originally sent using
 * checkGlobal and can be identified by its check id. The matches are ordered by the offsets in the
 * original document. The matches can be non-continuously. Usually it is a good idea to iterate from the last match
 * to the first match performing the replacement operation. The content of a match could differ from the original
 * document. Usually it is the readable version of what you submitted. For example, entities can be resolved.
 */
export interface MatchWithReplacement extends Match {
  replacement: string;
}


/**
 * An asset which should be downloaded by the integration and stored as the specified file name.
 */
export interface DownloadInfo {
  /**
   * The URL for the file to download.
   */
  url: string;

  /**
   * The file name at which the file should be stored at the hard drive.
   */
  filename: string;
}

export interface OpenWindowParameters {
  url: string;
}

/**
 * The result of {@link init}, which can contain an error.
 */
export interface InitResult {
  error?: SidebarError;
}


export interface SidebarError {
  /**
   *  The code which enables the integration to react:
   *
   *  `httpError` : Something went wrong while talking to server
   *  `tokenInvalid` : The token has not been accepted by the server
   *  `argumentPropertyInvalid` : Some argument is invalid, please check your arguments with the interface definition.
   */
  code: string;

  /**
   * Log, read or display this message to get additional information about the occurred error.
   */
  message: string;
}


export interface CheckError extends SidebarError {
  /**
   * The id of the check corresponding the check id returned by AcrolinxSidebar.checkGlobal() calls.
   */
  checkId: string;
}


/**
 * The plugin configuration tells the plugin what the sidebar supports.
 */
export interface AcrolinxPluginConfiguration {
  /**
   * The capabilities of the sidebar
   */
  supported: {
    /**
     * If true, you can send the document content in
     * {@link AcrolinxSidebar.checkGlobal}
     * base64 encoded and gzipped. In that case, you must set
     * {@link CheckOptions.base64EncodedGzipped} to true.
     */
    base64EncodedGzippedDocumentContent: boolean;
  };
}

/**
 * The sidebar will provide this interface in window.acrolinxSidebar.
 */
export interface AcrolinxSidebar {
  /**
   * Initializes the sidebar with the specified initParameters.
   * After calling this method, the sidebar will become ready for checking and call onInitFinished.
   *
   * ```
   *  acrolinxSidebar.init({
   *    clientSignature: 'sdfasdfiIOJEIEJIOR',
   *    clientComponents: [{
   *      id: 'com.acrolinx.myEditor'
   *      name:'Acrolinx for myEditor',
   *      version:'1.0.0.42'
   *    }]
   *  });
   * ```
   */
  init(initParameters: InitParameters): void;

  /**
   * Configures the sidebar with the specified parameters.
   * This method can be called repeatedly after init was called.
   *
   * ```
   *  acrolinxSidebar.configure({
   *    readOnlySuggestions: true
   *  });
   * ```
   */
  configure(configuration: SidebarConfiguration): void;

  /**
   *  Perform a check of the whole document. Once the check is done, {@link AcrolinxPlugin.onCheckResult} will be
   * notified.
   *
   * ```
   * acrolinxSidebar.checkGlobal('<sample>my text</sample>', {
   *    inputFormat: 'XML',
   *    requestDescription: {
   *      documentReference: 'myfile.xml'
   *    }
   * });
   * ```
   *
   * @param documentContent The document you want to check.
   * @return Object containing The ID of the check.
   *
   */
  checkGlobal(documentContent: string, options: CheckOptions): Check;

  onGlobalCheckRejected(): void;

  /**
   * This function can be used to invalidate check result cards that link to invalid parts of the document.
   * That can happen due to changes or deletions in the document.
   *
   * @param invalidCheckedDocumentRanges  checkIds and offsets belonging to a previous performed check.
   */
  invalidateRanges(invalidCheckedDocumentRanges: InvalidDocumentPart[]): void;

  /**
   * Notify the sidebar of the currently displayed part of the document.
   *
   * @param checkedDocumentRanges The ranges of previous performed checks.
   */
  onVisibleRangesChanged(checkedDocumentRanges: CheckedDocumentRange[]): void;
}


/**
 * The plug-in should provide this interface in window.acrolinxPlugin.
 * These functions are called by the AcrolinxSidebar.
 */
export interface AcrolinxPlugin {
  /**
   *  The sidebar has loaded and requests the AcrolinxPlugin to call acrolinxSidebar.init().
   */
  requestInit(): void;

  /**
   * The sidebar has finished initialization. Now the sidebar is ready for checking.
   *
   * Note: Usually you should wait for the configuration to be pushed via: acrolinxPlugin.configure() to know the
   *       capabilities of the sidebar.
   *
   *  @param finishResult Can contain an error if the initialization failed.
   */
  onInitFinished(finishResult: InitResult): void;

  /**
   *  The AcrolinxSidebar pushes the latest configuration to the AcrolinxPlugin.
   *
   *  @param configuration Contains capabilities.
   */
  configure(configuration: AcrolinxPluginConfiguration): void;

  /**
   * The check button has been pushed and the AcrolinxPlugin is requested to call AcrolinxSidebar.checkGlobal().
   *
   */
  requestGlobalCheck(): void;

  /**
   * Notifies the AcrolinxPlugin that a check has finished. If a global check has been performed, that's a good time
   * to clean up states belonging to previous checks.
   */
  onCheckResult(checkResult: CheckResult): void;

  /**
   * The integration should highlight and focus the matches belonging to the check of the checkId.
   * For selecting ranges, different strategies can be applied. A short overview:
   *
   * 1) Search: You just search for the content-attributes of the matches. The search can be improved by some fuzzy
   * matching and adding some characters from before and after the match to the search string. pro: easy in a simple
   * version, more or less stateless - con: fuzzy
   *
   * 2) Mapping: At the time you call check, you keep the document content and create a one to one mapping between
   * the document you checked and the document in your editor. This mapping needs to be kept up to date. Some editors
   * provide interfaces to easily implement that. pro: up to 100% exact - con: can be difficult or impossible to
   * implement, can be slow, requires a lot of memory
   *
   * 3) Indexing: Before calling check, you scatter indices in the document, which can be kept in source as well as
   * in the requested document. These indices reduce the search space later on, so that your search will be faster
   * and more precise. pro: fast, up to 100% precise - con: invasive, changes the source document
   *
   * 4) Combinations: You can combine all these methods to improve the positive aspects and reduce the negative
   * aspects of each strategy.
   *
   * Note: Implementing this function will be one of your core tasks while developing an Acrolinx integration.
   *
   * @param checkId The id of the check. You get the id as result of checkGlobal.
   * @param matches The parts of the document which should be highlighted.
   */
  selectRanges(checkId: string, matches: Match[]): void;

  /**
   * The integration should replace the matches belonging to the check of the checkId by its replacements.
   *
   * Note that in most cases you are able to reuse much of the implementation for {@link selectRanges}.
   *
   * @param checkId  The id of the check. You get the id as result of checkGlobal.
   * @param matchesWithReplacements The parts of the document, which should be replaced and its replacements.
   */
  replaceRanges(checkId: string, matchesWithReplacements: MatchWithReplacement[]): void;

  /**
   * This method is called if the sidebar needs to start a file download. Usually
   * you just need to pop up the URL in the downloadInfo with existing browser functions.
   *
   * @param downloadInfo Contains the URL to download.
   */
  download(downloadInfo: DownloadInfo): void;

  /**
   * @param openWindowParameters
   */
  openWindow(openWindowParameters: OpenWindowParameters): void;
}

export const ErrorCodes = {
  checkIsAlreadyRunning: 'checkIsAlreadyRunning',
  userIsNotLoggedIn: 'userIsNotLoggedIn',
  sidebarNotReadyForCheck: 'sidebarNotReadyForCheck',
  checkCanceledByUser: 'checkCanceledByUser',
  base64EncodedGzippedUnsupported: 'base64EncodedGzippedUnsupported'
};



