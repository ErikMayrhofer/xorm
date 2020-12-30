import { BehaviorSubject, Observable } from "rxjs";

export class FormModel {
  constructor(
    public value: BehaviorSubject<any>,
    public source: Observable<any>
  ) {}
}

export class FormView {
  $model: BehaviorSubject<FormModel>;
  constructor() {
    this.$model = new BehaviorSubject(null);
  }

  setModel(model: FormModel) {
    this.$model.next(model);
  }
}

function setNewFormValue(obj: any, name: string, value: any) {
  //TODO Deep access via dot-notation in obj
  obj[name] = value;
}

export function formView(node: HTMLElement, view: FormView) {
  let unregisterLastModel = null;
  view.$model.subscribe((newFormModel) => {
    if (!!unregisterLastModel) {
      unregisterLastModel();
    }
    unregisterLastModel = valueSubject(node, newFormModel.value);
  });
}
/*
  Draft implementation for RactiveForms

export function formView(reactiveFormValueChanges: Observable, view: FormView) {
  let lastSubscription = null;
  view.$model.subscribe((newFormModel) => {
    if(!!lastSubscription) {
      lastSubscription.unsubscribe();
    }
    lastSubscription = reactiveFormValueChanges.subscribe(newFormModel.value)
  })
}

export function formView(node: HTMLElement, view: FormView) {
  let unregisterLastModel = null;
  view.$model.subscribe((newFormModel) => {
    if (!!unregisterLastModel) {
      unregisterLastModel();
    }
    unregisterLastModel = valueSubject(node, newFormModel.value);
  });
}*/

export function valueSubject(node: HTMLElement, subject: BehaviorSubject<any>) {
  console.log("Attaching FormView to ", node);

  const updateView = (event: Event) => {
    let inputElement = event.target as HTMLInputElement;
    let name = inputElement.name;
    let value = inputElement.value;

    let old = subject.getValue();
    setNewFormValue(old, name, value);
    subject.next(old);
  };

  const unregisterMemory: {
    element: HTMLInputElement;
    listener: (event: Event) => void;
  }[] = [];

  let initValue = subject.value;
  for (let i = 0; i < node.children.length; i++) {
    let elem = node.children[i];
    if ("value" in elem && "name" in elem && "addEventListener" in elem) {
      let inputElement = elem as HTMLInputElement;
      inputElement.addEventListener("input", updateView);

      let initThisValue = initValue[inputElement.name]; //TODO Deep access via dot-notation in obj
      if (initThisValue !== undefined) {
        inputElement.value = initThisValue;
      } else {
        setNewFormValue(initValue, inputElement.name, inputElement.value);
      }
      unregisterMemory.push({
        element: inputElement,
        listener: updateView,
      });
    }
  }
  subject.next(initValue);

  return () => {
    unregisterMemory.forEach((it) => {
      it.element.removeEventListener("input", it.listener);
    });
  };
}
