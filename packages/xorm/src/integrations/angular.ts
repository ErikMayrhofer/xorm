import { Observable } from "rxjs";
import { FormView } from "..";

export function reactiveFormView(
  reactiveFormValueChanges: Observable<any>,
  view: FormView
) {
  let lastSubscription = null;
  view.$model.subscribe((newFormModel) => {
    if (!!lastSubscription) {
      lastSubscription.unsubscribe();
    }
    lastSubscription = reactiveFormValueChanges.subscribe(newFormModel.value);
  });
}
