import { BehaviorSubject } from "rxjs";
import {
  FormSupervisor,
  FormModel,
  MUTATION_DELETED,
  ServerAdapter,
} from "../src";

export function quickMockServerAdapter() {
  const adapter = {
    delete: jest.fn((id) => new Promise((resolve) => setTimeout(resolve, 0))),
    save: jest.fn((id) => new Promise((resolve) => setTimeout(resolve, 0))),
  };
  return adapter;
}

function genAdapterAndSupervisor() {
  const adapter = quickMockServerAdapter();
  let supervisor = new FormSupervisor(adapter as ServerAdapter);
  return { adapter, supervisor };
}

describe("formsupervisor", () => {
  test("set formmodel", () => {
    const adapter = {
      delete: jest.fn((id) => new Promise((resolve) => setTimeout(resolve, 0))),
      save: jest.fn((id) => new Promise((resolve) => setTimeout(resolve, 0))),
    };
    let supervisor = new FormSupervisor(adapter as ServerAdapter);
    let modelsSubject = new BehaviorSubject([]);
    supervisor.$models.subscribe(modelsSubject);

    expect(modelsSubject.value.length).toBe(0);

    let testKey = supervisor.get("testKey");
    expect(testKey.value).toBeNull();
    expect(modelsSubject.value.length).toBe(0);

    supervisor.set(
      "testKey",
      new FormModel(
        new BehaviorSubject({ id: "testKey" }),
        new BehaviorSubject({ id: "testKey" })
      )
    );

    testKey = supervisor.get("testKey");
    expect(testKey.value).not.toBeNull();
    expect(modelsSubject.value.length).toBe(1);
  });

  test("delete unknown value", async () => {
    const { adapter, supervisor } = genAdapterAndSupervisor();
    await expect(supervisor.delete("unknown")).rejects.toEqual(
      new Error("Supervisor had no value for id unknown")
    );
  });
  test("save unknown value", async () => {
    const { adapter, supervisor } = genAdapterAndSupervisor();
    await expect(supervisor.save("unknown")).rejects.toEqual(
      new Error("Supervisor had no value for id unknown")
    );
  });
  test("reset unknown value", async () => {
    const { adapter, supervisor } = genAdapterAndSupervisor();
    expect(() => {
      supervisor.reset("unknown");
    }).toThrow(new Error("Supervisor had no value for id unknown"));
  });
  test("delete client-side value", async () => {
    const { adapter, supervisor } = genAdapterAndSupervisor();
    let model = new FormModel(
      new BehaviorSubject({ id: "" }),
      new BehaviorSubject({ id: "" })
    );

    supervisor.set("testKey", model);

    expect(model.$clientSide.value).toBeTruthy();
    await expect(supervisor.delete("testKey")).resolves.toBeUndefined();
    expect(adapter.delete).not.toHaveBeenCalled();
    expect(adapter.save).not.toHaveBeenCalled();
    expect(model.$mutation.value).toBe(MUTATION_DELETED);
  });

  test("save value", async () => {
    const { adapter, supervisor } = genAdapterAndSupervisor();
    let model = new FormModel(
      new BehaviorSubject({ id: "" }),
      new BehaviorSubject({ id: "" })
    );

    supervisor.set("testKey", model);

    expect(model.$clientSide.value).toBeTruthy();
    await expect(supervisor.save("testKey")).resolves.toBeUndefined();
    expect(adapter.delete).not.toHaveBeenCalled();
    expect(adapter.save).toHaveBeenCalledTimes(1);
    expect(model.$clientSide.value).toBeFalsy();
  });

  test("delete saved value", async () => {
    const { adapter, supervisor } = genAdapterAndSupervisor();
    let model = new FormModel(
      new BehaviorSubject({ id: "" }),
      new BehaviorSubject({ id: "" })
    );

    supervisor.set("testKey", model);

    expect(model.$clientSide.value).toBeTruthy();
    await expect(supervisor.save("testKey")).resolves.toBeUndefined();
    await expect(supervisor.delete("testKey")).resolves.toBeUndefined();
    expect(adapter.delete).toHaveBeenCalledTimes(1);
    expect(adapter.save).toHaveBeenCalledTimes(1);
    expect(model.$mutation.value).toBe(MUTATION_DELETED);
  });
  test("reset value", async () => {
    const { adapter, supervisor } = genAdapterAndSupervisor();
    let model = new FormModel(
      new BehaviorSubject({ id: "" }),
      new BehaviorSubject({ id: "" })
    );
    const resetFn = jest.fn();
    model.reset = resetFn;

    supervisor.set("testKey", model);

    expect(model.$clientSide.value).toBeTruthy();
    supervisor.reset("testKey");
    expect(adapter.delete).not.toHaveBeenCalled();
    expect(adapter.save).not.toHaveBeenCalled();
    expect(resetFn).toHaveBeenCalledTimes(1);
  });
  test("create-view", () => {
    const { adapter, supervisor } = genAdapterAndSupervisor();
    const firstView = supervisor.createView();
    const secondView = supervisor.createView();
    expect(firstView).not.toBeUndefined();
    expect(firstView).not.toBeNull();
    expect(firstView).not.toBe(secondView);
  });
});
