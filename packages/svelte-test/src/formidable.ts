import { BehaviorSubject, combineLatest, Observable, of, Subject } from "rxjs";
import { filter, map, shareReplay, switchMap } from "rxjs/operators";
import { v4 as uuidv4 } from "uuid";

interface FormModelDataBase {
  id: string;
}

function compareFormDatas(a: any, b: any) {
  let result = JSON.stringify(a) == JSON.stringify(b);

  console.log("Comparing ", a, result ? "==" : "!=", b);
  return result;
}

export class Mutation {
  constructor(public message: string) {
    this.clientMutationId = uuidv4();
  }
  clientMutationId: number;
}

export const TAG_DELETING = 0b1;
export const TAG_SAVING = 0b10;
export const TAG_ISNEW = 0b100;

export class FormModel {
  constructor(
    public value: BehaviorSubject<FormModelDataBase>,
    public source: Observable<any>
  ) {
    this.$pristine = combineLatest([value, source]).pipe(
      map(([val, src]) => compareFormDatas(val, src))
    );
    this.$mutation = new BehaviorSubject(null);
    this.$editable = this.$mutation.pipe(map((it) => it == null));
  }

  $pristine: Observable<boolean>;

  $mutation: BehaviorSubject<Mutation>;

  setMutation(mut: Mutation) {
    if (this.$mutation.value != null) {
      throw new Error("Cannot mutate already mutating entity");
    }
    this.$mutation.next(mut);
  }
  closeMutation(mut: Mutation) {
    if (!this.$mutation.value) {
      throw new Error(
        `Tried to close Mutation ${mut.clientMutationId}, when no active Mutation was found`
      );
    }
    if (this.$mutation.value.clientMutationId !== mut.clientMutationId) {
      throw new Error(
        `Active Mutation was ${this.$mutation.value.clientMutationId}, tried to close Mutation ${mut.clientMutationId}`
      );
    }
    this.$mutation.next(null);
  }

  $editable: Observable<boolean>;
}

export interface FormView {
  $model: Observable<FormModel>;
  $pristine: Observable<boolean>;
}
export class SimpleFormView implements FormView {
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

export class ServerAdapter {
  async delete(id: string) {
    // = DELETE
    await new Promise((resolve) => setTimeout(() => resolve(null), 1000));
    console.log(`[SERVER] DELETE ${id}`);
  }

  async save(model: FormModel) {
    // = UPSERT
    if (!("next" in model.source)) {
      throw new Error("ServerAdapter only supports BehaviorSubject sources");
    }
    await new Promise((resolve) => setTimeout(() => resolve(null), 1000));
    console.log("[SERVER] SAVE", model);
    (model.source as BehaviorSubject<any>).next(
      Object.assign({}, model.value.value)
    );
  }
}

/**
 * CRUD
 *
 * C:
 *   - supervisor.set(NEW ID, NEW pristine-)
 * R:
 *   - supervisor.set(ID, pristine-server-fetched-model)
 *   - save -> won't be needed because model is pristine
 * U:
 *   - supervisor.set(ID, pristine-server-fetched-model)
 *   - edits -> make model non-pristine
 *   - save -> use ID and nonpristine-server-fetched-model to UPDATE
 *
 */
export class FormSupervisor {
  constructor(private adapter: ServerAdapter) {
    this.data = {};
    this.$models = new BehaviorSubject<FormModel[]>([]);
  }

  get(key: string) {
    if (!(key in this.data)) {
      this.addKey(key);
    }
    return this.data[key];
  }

  private addKey(key: string) {
    this.data[key] = new BehaviorSubject(null);
  }

  data: { [key: string]: BehaviorSubject<FormModel | null> };

  set(key: string, model: FormModel) {
    this.get(key).next(model);
    this.refreshKeysSubject();
  }

  createView() {
    return new SupervisedFormView(this);
  }

  async delete(key: string) {
    let mutation = new Mutation("Delete...");
    let val = this.data[key].value;
    if (!val) {
      throw new Error(`Supervisor had no value for id ${key}`);
    }

    val.setMutation(mutation);
    await this.adapter.delete(key);
    val.closeMutation(mutation);
    this.data[key].next(null);
    this.refreshKeysSubject();
  }
  async save(key: string) {
    let val = this.data[key].value;
    if (!val) {
      throw new Error(`Supervisor had no value for id ${key}`);
    }
    let mutation = new Mutation("Save..");
    val.setMutation(mutation);
    await this.adapter.save(val);
    val.closeMutation(mutation);
    //Refresh source of this.data[key]
  }

  refreshKeysSubject() {
    this.$models.next(
      Object.entries(this.data)
        .filter(([key, value]) => value.value != null)
        .map(([key, value]) => value.value)
    );
  }

  $models: Subject<FormModel[]>;
}

export class SupervisedFormView implements FormView {
  $rawModel: Observable<FormModel>;
  $model: Observable<FormModel>;
  $id: BehaviorSubject<string>;
  constructor(private supervisor: FormSupervisor) {
    this.$id = new BehaviorSubject(null);
    this.$rawModel = this.$id.pipe(
      switchMap((newId) =>
        newId == null ? of(null) : this.supervisor.get(newId)
      ),
      shareReplay(1)
    );
    this.$model = this.$rawModel.pipe(filter((it) => it != null));
    this.$existent = this.$rawModel.pipe(map((it) => it != null));

    this.$editable = this.$rawModel.pipe(
      switchMap((newFormModel) =>
        newFormModel == null ? of(false) : newFormModel.$editable
      )
    );

    this.$pristine = this.$model.pipe(
      switchMap((newFormModel) => newFormModel.$pristine)
    );
  }

  setId(id: string) {
    this.$id.next(id);
  }

  async save() {
    this.supervisor.save(this.$id.value);
  }
  async delete() {
    this.supervisor.delete(this.$id.value);
  }

  $pristine: Observable<boolean>;
  $existent: Observable<boolean>;
  $editable: Observable<boolean>;
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
