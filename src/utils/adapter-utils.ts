import * as _ from "lodash";
import {isDisplayed} from "../utils/utils";
import {AutobindWrapperAttributes} from "../adapters/AdapterInterface";

export function getAutobindWrapperAttributes(element: Element) {
  let eleDisplay = isDisplayed(element) ? "" : "hidden";
  const attributes: AutobindWrapperAttributes = {
    'original-id': element.id,
    'original-class': element.className,
    'original-name': (element as HTMLInputElement).name,
    'original-source': element.tagName.toLowerCase(),
    'original-display': eleDisplay
  };
  return _.omitBy(attributes, _.isEmpty) as AutobindWrapperAttributes;
}