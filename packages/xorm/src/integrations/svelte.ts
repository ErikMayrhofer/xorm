import { FormView } from "..";
import { valueSubject } from "../bindValue";

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
  });
}
