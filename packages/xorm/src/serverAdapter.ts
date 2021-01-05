import { BehaviorSubject } from "rxjs";
import { FormModel } from ".";

export interface ServerAdapter {
  delete(id: string): Promise<void>;
  save(model: FormModel): Promise<void>;
}
export class NoServerAdapter implements ServerAdapter {
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
