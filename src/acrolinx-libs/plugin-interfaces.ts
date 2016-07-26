/**
 * This document describes the interface of the Acrolinx Sidebar.
 *
 * Let's understand how the typical bootstrapping of an integration and the Acrolinx Sidebar works:
 *
 * 1) Load host editor of your integration
 * 2) Load your integration code
 * 3) Register your integration as acrolinxPlugin (var acrolinxPlugin = {...})
 *    @see AcrolinxPlugin interface for required methods
 * 4) Load sidebar and referenced libs code (usually sidebar.js, libs.js, sidebar.css)
 * 5) Once the sidebar has finished loading it will request the integration to initialize.
 *    acrolinxPlugin.requestInit() will be called.
 * 6) The acrolinxPlugin must call acrolinxSidebar.init(InitParameter).
 * 7) Once the init has finished, the plug-in will be notified: acrolinxPlugin.onInitFinished() is called.
 * 8) From time to time, the sidebar will call acrolinxPlugin.Configure() to push the latest configuration to the
 *    plug-in.
 * 9) If the user pushes the button "Check", acrolinxPlugin.requestGlobalCheck() is called.
 * 10) The acrolinxPlugin must call acrolinxSidebar.checkGlobal() to perform a check.
 *     @see acrolinxSidebar.checkGlobal()
 * 11) When the check finished, acrolinxPlugin.onCheckResult() is called and the sidebar displays cards for the issues.
 * 12) If the user clicks a card acrolinxPlugin.selectRanges() is called
 * 13) When the user selects a replacement acrolinxPlugin.replaceRanges() is called.
 * 14) ... @see method description on AcrolinxPlugin
 *
 * For a minimal integration (not feature complete) you must implement requestInit, requestGlobalCheck, configure,
 *   selectRanges, replaceRanges and download.
 */
namespace acrolinx.sidebar {
  'use strict';

  export interface InitParameters {

    /**
     * Provides information about your integration and other client software components for the about dialog and
     * analytics.
     */
    clientComponents?: SoftwareComponent[];

    /**
     * Should be equal to or start with "en" or "de".
     */
    clientLocale?: string;

    /**
     *  The integration specific clientSignature. To get one, ask your Acrolinx contact.
     */
    clientSignature?: string;

    /**
     * Default value is '' which means the base URL of the host that it runs from.
     */
    serverAddress?: string;

    /**
     * Enables user to manually change the serverAddress on the sign in screen.
     */
    showServerSelector?: boolean;

    inlineRuleHelp?: boolean;

    /**
     * This settings will overwrite the saved settings of the user.
     */
    checkSettings?: CheckSettings;

    /**
     * This settings will be used as initial default settings when the user uses the sidebar for the first time.
     * If checkSettings is defined then the defaultCheckSettings will be ignored.
     */
    defaultCheckSettings?: CheckSettings;

    enableSingleSignOn?: boolean;

    /**
     * This setting will render cards with suggestions in read-only mode. This means the sidebar won't trigger
     * suggestion replacements in the document. The cards will still work for navigation.
     */
    readOnlySuggestions?: boolean;

    /**
     * This setting will prevent connection with server via other than HTTPS protocol.
     */
    enforceHTTPS?: boolean;

  }

  interface CheckSettings {
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
   * Provides information about your integration and other client software components for the about dialog and
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
     * This name will be displayed in the UI.
     */
    name: string;

    /**
     * The version of the software component.
     * Format: ${major}.${minor}.${patch}.${buildNumber}
     * Example: '1.2.3.574'
     */
    version: string;

    /**
     * @See SoftwareComponentCategory
     * Default value if omitted: 'DEFAULT'
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
     * Tells the server if the document content used AcrolinxSidebar.checkGlobal()
     * is base64 encoded and gzipped.
     * Note: You only can set this setting and encode and compress your document content, if the sidebar supports this
     * function. Check the AcrolinxPluginConfiguration.supported.base64EncodedGzippedDocumentContent which is pushed
     * via AcrolinxPlugin.configure().
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
   * Each checkGlobal() call will return an unique id, which helps the plugin to map results,
   * selection, and replacement requests to the corresponding checked document. This is necessary, because the returned
   * offsets are only valid for the document at a specific point in time. All changes made to the document after the
   * check call will make the offsets invalid. That's why it’s a good idea to store the submitted document contents
   * together with its check ids in a map.
   */
  export interface Check {
    checkId: string;
  }


  /**
   * The sidebar will tell the plug-in using checkedPart which parts of the document had been checked.
   */
  export interface CheckResult {
    /**
     * The part of the document which was checked by the server. If the server recognizes that parts of the document
     * are missing, only valid parts will be checked.
     */
    checkedPart: CheckedDocumentPart;
    /**
     * If an error occurred the error object is set.
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
     * @see Check
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
   * @see AcrolinxPlugin.download()
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
   * The result of the AcrolinxSidebar.init(), which can contain an error.
   */
  export interface InitResult {
    error?: SidebarError;
  }


  export interface SidebarError {
    /**
     *  The code which enables the integration to react:
     *
     *  httpError: Something went wrong while talking to server
     *  tokenInvalid: The token has not been accepted by the server
     *  argumentPropertyInvalid: Some argument is invalid, please check your arguments with the interface definition.
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
       * AcrolinxSidebar.checkGlobal()
       * base64 encoded and gzipped. In that case, you must set
       * CheckOptions.base64EncodedGzipped to true.
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
     * @example
     *  acrolinxSidebar.init({
     *    clientSignature: 'sdfasdfiIOJEIEJIOR',
     *    pluginDownloadInfo: {
     *      installedPluginName:'Acrolinx for Me',
     *      installedPluginVersion:'1',
     *      installedPluginBuildNumber:'42'
     *    }
     *  });
     */
    init (initParameters: InitParameters): void;

    /**
     *  Perform a check of the whole document. Once the check is done, acrolinxPlugin.onCheckResult() will be notified.
     *
     * @example
     * acrolinxSidebar.checkGlobal('<sample>my text</sample>', {
     *    inputFormat: 'XML',
     *    requestDescription: {
     *      documentReference: 'myfile.xml'
     *    }
     * }):
     *
     * @param documentContent The document you want to check.
     * @return Object containing The ID of the check.
     *
     */
    checkGlobal(documentContent: string, options: CheckOptions): Check;

    onGlobalCheckRejected(): void;

    /**
     * This function can be used to invalidate parts of the document, which had been changed or deleted.
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
     * @see AcrolinxSidebar.checkGlobal()
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
     * 1) Search: You just search for the content-attributes of the matches. The search can be improved by some fuzzy
     * matching and adding some characters from before and after the match to the search string. pro: easy in a simple
     * version, more or less stateless - con: fuzzy
     * 2) Mapping: At the time you call check, you keep the document content and create a one to one mapping between
     * the document you checked and the document in your editor. This mapping needs to be kept up to date. Some editors
     * provide interfaces to easily implement that. pro: up to 100% exact - con: can be difficult or impossible to
     * implement, can be slow, requires a lot of memory
     * 3) Indexing: Before calling check, you scatter indices in the document, which can be kept in source as well as
     * in the requested document. These indices reduce the search space later on, so that your search will be faster
     * and more precise. pro: fast, up to 100% precise - con: invasive, changes the source document
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
     * Note: Often you are able to reuse much of the implementation for selectRanges.
     *
     * @param checkId  The id of the check. You get the id as result of checkGlobal.
     * @param matchesWithReplacements The parts of the document, which should be replaced and its replacements.
     */
    replaceRanges(checkId: string, matchesWithReplacements: MatchWithReplacement[]): void;

    /**
     * This method is called if the sidebar needs to start a file download. Usually
     * you just need to pop up the URL in the downloadInfo with existing browser functions. This method enables the
     * integration to jump in and perform some special download logic.
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


}


