import * as _ from "lodash";
import {AutobindWrapperAttributes} from "../adapters/AdapterInterface";

export function getAutobindWrapperAttributes(element: Element) {
  const attributes: AutobindWrapperAttributes = {
    'original-id': element.id,
    'original-class': element.className,
    'original-name': (element as HTMLInputElement).name,
    'original-source': element.tagName.toLowerCase()
  };
  return _.omitBy(attributes, _.isEmpty) as AutobindWrapperAttributes;
}