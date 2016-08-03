import {EditorAttributes} from "../adapters/AdapterInterface";

export function getEditorAttributes(element: Element) {
  const attributes: EditorAttributes =  {
    id: element.id,
    class: element.className,
    name: (element as HTMLInputElement).name
  };
  return _.omitBy(attributes, _.isEmpty) as EditorAttributes;
}