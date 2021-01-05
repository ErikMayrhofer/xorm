import { BehaviorSubject } from "rxjs";
import { FormModelDataBase, FormModel, Mutation } from "../src";

interface TestFormModel extends FormModelDataBase {
  name: string;
}
describe("FormModel", () => {
  test("pristine", async () => {
    let value: TestFormModel = {
      id: "testKey",
      name: "InitialValue",
    };
    let source: TestFormModel = {
      id: "testKey",
      name: "InitialValue",
    };
    let $source = new BehaviorSubject(source);
    let $value = new BehaviorSubject(value as FormModelDataBase);
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
    let $value = new BehaviorSubject(value as FormModelDataBase);
    let formModel = new FormModel($value, $source);
    let activeValueChange = new BehaviorSubject(undefined);
    formModel.$activeDataChange.subscribe(activeValueChange);

    expect(activeValueChange.value).toBeUndefined();

    formModel.reset();

    expect(activeValueChange.value).toBe(source);
  });

  test("setMutation and editable", () => {
    let value = {
      id: "testKey",
      name: "OtherValue",
    };
    let source = {
      id: "testKey",
      name: "InitialValue",
    };
    let $source = new BehaviorSubject(source);
    let $value = new BehaviorSubject(value as FormModelDataBase);
    let formModel = new FormModel($value, $source);
    let mutationSubscriber = new BehaviorSubject<Mutation | undefined>(
      undefined
    );
    let editable = new BehaviorSubject(undefined);
    formModel.$editable.subscribe(editable);
    formModel.$mutation.subscribe(mutationSubscriber);

    expect(editable.value).not.toBeUndefined();
    expect(editable.value).toBeTruthy();

    let mutation = new Mutation("TestMutation");
    formModel.setMutation(mutation);

    expect(mutationSubscriber.value).not.toBeUndefined();
    expect(mutationSubscriber.value.message).toBe("TestMutation");
    expect(mutationSubscriber.value.clientMutationId.length).toBeGreaterThan(0);
    expect(editable.value).not.toBeUndefined();
    expect(editable.value).toBeFalsy();

    formModel.closeMutation(mutation);

    expect(mutationSubscriber.value).toBeNull();
    expect(editable.value).not.toBeUndefined();
    expect(editable.value).toBeTruthy();
  });

  test("setMutation on mutating object", () => {
    let value = {
      id: "testKey",
      name: "OtherValue",
    };
    let source = {
      id: "testKey",
      name: "InitialValue",
    };
    let $source = new BehaviorSubject(source);
    let $value = new BehaviorSubject(value as FormModelDataBase);
    let formModel = new FormModel($value, $source);

    let mutation = new Mutation("TestMutation");
    let secondMutation = new Mutation("EvilSecondMutation");
    formModel.setMutation(mutation);

    expect(() => {
      formModel.setMutation(secondMutation);
    }).toThrow(new Error("Cannot mutate already mutating entity"));

    formModel.closeMutation(mutation);
  });
  test("closeMutation on non-mutating object", () => {
    let value = {
      id: "testKey",
      name: "OtherValue",
    };
    let source = {
      id: "testKey",
      name: "InitialValue",
    };
    let $source = new BehaviorSubject(source);
    let $value = new BehaviorSubject(value as FormModelDataBase);
    let formModel = new FormModel($value, $source);

    let mutation = new Mutation("TestMutation");
    formModel.setMutation(mutation);

    formModel.closeMutation(mutation);
    expect(() => {
      formModel.closeMutation(mutation);
    }).toThrow(
      /Tried to close Mutation [0-9a-f\-]+, when no active Mutation was found/
    );
  });
  test("close wrong mutation", () => {
    let value = {
      id: "testKey",
      name: "OtherValue",
    };
    let source = {
      id: "testKey",
      name: "InitialValue",
    };
    let $source = new BehaviorSubject(source);
    let $value = new BehaviorSubject(value as FormModelDataBase);
    let formModel = new FormModel($value, $source);

    let mutation = new Mutation("TestMutation");
    let wrongMutation = new Mutation("WrongMutation");
    formModel.setMutation(mutation);

    expect(() => {
      formModel.closeMutation(wrongMutation);
    }).toThrow(
      /Active Mutation was [0-9a-f\-]+, tried to close Mutation [0-9a-f\-]+/
    );
  });
});
