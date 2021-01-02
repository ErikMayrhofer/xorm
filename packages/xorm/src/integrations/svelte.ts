import { FormView } from "..";
import { valueSubject } from "../bindValue";

function findNameIn(
  node: Element,
  name: string
): { name: string; value: string } {
  if ("name" in node && "value" in node) {
    if (node["name"] == name) {
      return node;
    }
  }
  for (let i = 0; i < node.children.length; i++) {
    let result = findNameIn(node.children[i], name);
    if (result != null) {
      return result;
    }
  }
  return null;
}

export function htmlFormView(node: HTMLElement, view: FormView) {
  let unregisterLastModel = null;
  view.$model.subscribe((newFormModel) => {
    if (!!unregisterLastModel) {
      unregisterLastModel();
    }
    unregisterLastModel = valueSubject(node, newFormModel.value);
  });

  view.$activeDataChange.subscribe((newHtmlData) => {
    console.log("Active Data Change HTML TO: ", newHtmlData);
    for (let key in newHtmlData) {
      findNameIn(node, key).value = newHtmlData[key];
    }
  });
}
