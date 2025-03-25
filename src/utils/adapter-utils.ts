import { AutobindWrapperAttributes } from '../adapters/adapter-interface';
import { isDisplayed } from '../utils/utils';

export function getAutobindWrapperAttributes(element: Element): AutobindWrapperAttributes {
  const attributes: AutobindWrapperAttributes = {
    'original-id': element.id,
    'original-class': element.className,
    'original-name': (element as HTMLInputElement).name,
    'original-source': element.tagName.toLowerCase(),
    'original-display': isDisplayed(element) ? '' : 'hidden',
  };

  for (const attributeName of element.getAttributeNames().filter((it) => it.startsWith('aria-'))) {
    attributes['original-' + attributeName] = element.getAttribute(attributeName)!;
  }

  return Object.fromEntries(Object.entries(attributes).filter(([, value]) => value)) as AutobindWrapperAttributes;
}
