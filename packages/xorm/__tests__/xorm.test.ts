import { ServerAdapter, FormSupervisor, FormModel } from "../lib/index";
import { BehaviorSubject } from "rxjs";
import { valueSubject } from "../src/bindValue";

describe("formsupervisor", () => {
  test("set formmodel", () => {
    let adapter = new ServerAdapter();
    let supervisor = new FormSupervisor(adapter);
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
});

describe("FormModel", () => {
  test("pristine", async () => {
    let value = {
      id: "testKey",
      name: "InitialValue",
    };
    let source = {
      id: "testKey",
      name: "InitialValue",
    };
    let $source = new BehaviorSubject(source);
    let $value = new BehaviorSubject(value);
    let formModel = new FormModel($value, $source);
    let pristine = new BehaviorSubject(undefined);
    formModel.$pristine.subscribe(pristine);

    expect(pristine.value).not.toBeUndefined();
    expect(pristine.value).toBeTruthy();

    value.name = "ChangedValue";
    $value.next(value);

    expect(pristine.value).toBeFalsy();

    value.name = "InitialValue";
    $value.next(value);

    expect(pristine.value).toBeTruthy();
  });

  test("reset", async () => {
    let value = {
      id: "testKey",
      name: "OtherValue",
    };
    let source = {
      id: "testKey",
      name: "InitialValue",
    };
    let $source = new BehaviorSubject(source);
    let $value = new BehaviorSubject(value);
    let formModel = new FormModel($value, $source);
    let activeValueChange = new BehaviorSubject(undefined);
    formModel.$activeDataChange.subscribe(activeValueChange);

    expect(activeValueChange.value).toBeUndefined();

    formModel.reset();

    expect(activeValueChange.value).toBe(source);
  });
});
