import {
  BehaviorSubject,
  combineLatest,
  Observable,
  of,
  ReplaySubject,
  Subject,
} from "rxjs";
import {
  filter,
  map,
  share,
  shareReplay,
  switchMap,
  tap,
} from "rxjs/operators";
import { v4 as uuidv4 } from "uuid";

interface FormModelDataBase {
  id: string;
}

function compareFormDatas(a: any, b: any) {
  let result = JSON.stringify(a) == JSON.stringify(b);

  console.log("Comparing... ", a, result ? "==" : "!=", b);
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
    public rawSource: Observable<any>
  ) {
    this.$source = rawSource.pipe(shareReplay(1));
    this.$source.subscribe((source) => (this.lastSource = source));

    this.$pristine = combineLatest([value, this.$source]).pipe(
      map(([val, src]) => compareFormDatas(val, src))
    );
    this.$mutation = new BehaviorSubject(null);
    this.$editable = this.$mutation.pipe(map((it) => it == null));

    this.$source.subscribe((val) => console.log("Source: ", val));

    this.$activeDataChange = new Subject();
  }
  private $source: Observable<any>;

  private lastSource: any;

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

  public reset() {
    console.log("Reset... to ", this.lastSource);
    this.value.next(this.lastSource); //What about nulls here...
    this.$activeDataChange.next(this.lastSource);
  }

  $editable: Observable<boolean>;

  public $activeDataChange: Subject<any>;
}

export interface FormView {
  $model: Observable<FormModel>;
  $pristine: Observable<boolean>;
  $activeDataChange: Observable<any>;
}

export class ServerAdapter {
  async delete(id: string) {
    // = DELETE
    await new Promise((resolve) => setTimeout(() => resolve(null), 1000));
    console.log(`[SERVER] DELETE ${id}`);
  }

  async save(model: FormModel) {
    // = UPSERT
    if (!("next" in model.rawSource)) {
      throw new Error("ServerAdapter only supports BehaviorSubject sources");
    }
    await new Promise((resolve) => setTimeout(() => resolve(null), 1000));
    console.log("[SERVER] SAVE", model.value.value);
    (model.rawSource as BehaviorSubject<any>).next(
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

  reset(key: string) {
    let val = this.data[key].value;
    if (!val) {
      throw new Error(`Supervisor had no value for id ${key}`);
    }
    val.reset();
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
  $pristine: Observable<boolean>;
  $existent: Observable<boolean>;
  $editable: Observable<boolean>;

  public $activeDataChange: Observable<any>;

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

    this.$activeDataChange = this.$model.pipe(
      switchMap((newFormModel) => newFormModel.$activeDataChange)
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
  reset() {
    this.supervisor.reset(this.$id.value);
  }
}

export { htmlFormView } from "./integrations/svelte";
export { reactiveFormView } from "./integrations/angular";
