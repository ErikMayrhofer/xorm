import { BehaviorSubject, combineLatest, Observable, Subject } from "rxjs";
import { map, switchMap } from "rxjs/operators";

function compareFormDatas(a: any, b: any) {
  let result = JSON.stringify(a) == JSON.stringify(b);

  console.log("Comparing ", a, result ? "==" : "!=", b);
  return result;
}

export class FormModel {
  constructor(
    public value: BehaviorSubject<any>,
    public source: Observable<any>
  ) {
    this.$pristine = combineLatest([value, source]).pipe(
      map(([val, src]) => compareFormDatas(val, src))
    );
  }

  $pristine: Observable<boolean>;
}

export class FormView {
  $model: BehaviorSubject<FormModel>;
  constructor() {
    this.$model = new BehaviorSubject(null);
    this.$pristine = this.$model.pipe(
      switchMap((newFormModel) => newFormModel.$pristine)
    );
  }

  setModel(model: FormModel) {
    this.$model.next(model);
  }

  $pristine: Observable<boolean>;
}

export class FormSupervisor {
  constructor() {
    this.data = {};
  }

  get(key: string) {
    if (key! in this.data) {
      this.data[key] = new BehaviorSubject(null);
    }
    return this.data[key];
  }

  data: { [key: string]: BehaviorSubject<FormModel | null> };
}

export class SupervisedFormView {
  $model: Observable<FormModel>;
  $id: BehaviorSubject<string>;
  constructor(private supervisor: FormSupervisor) {
    this.$model = this.$id.pipe(
      switchMap((newId) => this.supervisor.get(newId))
    );
    this.$pristine = this.$model.pipe(
      switchMap((newFormModel) => newFormModel.$pristine)
    );
  }

  setId(id: string) {
    this.$id.next(id);
  }

  $pristine: Observable<boolean>;
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
