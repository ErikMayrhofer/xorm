import { Observable, BehaviorSubject, of } from "rxjs";
import { switchMap, shareReplay, filter, map } from "rxjs/operators";
import { FormModel } from "./formModel";
import { FormSupervisor } from "./formSupervisor";

export interface FormView {
  $model: Observable<FormModel>;
  $pristine: Observable<boolean>;
  $activeDataChange: Observable<any>;
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

  setId(key: string) {
    this.$id.next(key);
  }

  async save() {
    if (!this.$id.value) {
      throw new Error(`Cannot save id ${this.$id.value}`);
    }
    await this.supervisor.save(this.$id.value);
  }
  async delete() {
    if (!this.$id.value) {
      throw new Error(`Cannot delete id ${this.$id.value}`);
    }
    await this.supervisor.delete(this.$id.value);
  }
  reset() {
    if (!this.$id.value) {
      throw new Error(`Cannot reset id ${this.$id.value}`);
    }
    this.supervisor.reset(this.$id.value);
  }
}
