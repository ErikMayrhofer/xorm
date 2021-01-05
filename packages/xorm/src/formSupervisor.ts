import { BehaviorSubject, Subject } from "rxjs";
import { Mutation, MUTATION_DELETED, ServerAdapter } from ".";
import { FormModel } from "./formModel";
import { SupervisedFormView } from "./formView";

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
    let val = this.getValueOf(key);

    if (!val.$clientSide.value) {
      val.setMutation(mutation);
      await this.adapter.delete(key);
      val.closeMutation(mutation);
    }
    val.setMutation(MUTATION_DELETED);
    this.data[key].next(null);
    this.refreshKeysSubject();
  }
  async save(key: string) {
    let val = this.getValueOf(key);
    let mutation = new Mutation("Save..");
    val.setMutation(mutation);
    await this.adapter.save(val);
    val.$clientSide.next(false);
    val.closeMutation(mutation);
    //Refresh source of this.data[key]
  }

  reset(key: string) {
    let val = this.getValueOf(key);
    val.reset();
  }

  private getValueOf(key: string) {
    let val = this.data[key]?.value;
    if (!val) {
      throw new Error(`Supervisor had no value for id ${key}`);
    }
    return val;
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
