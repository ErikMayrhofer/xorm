import { FormModel, Mutation, ServerAdapter, SupervisedFormView } from "../src";
import { quickMockServerAdapter } from "./util/quickMock";
import { FormSupervisor } from "../src/formSupervisor";
import { BehaviorSubject, of, Subject } from "rxjs";
jest.mock("../src/formSupervisor");

describe.only("SupervisedFormView", () => {
  beforeEach(() => {
    (FormSupervisor as any).mockClear();
  });
  test("view fetches model from supervisor", () => {
    //Setup
    const adapter = quickMockServerAdapter();
    const supervisor = new FormSupervisor(adapter as ServerAdapter);
    const formModel = new FormModel(
      new BehaviorSubject({ id: "" }),
      new BehaviorSubject({})
    );
    (formModel as any).TRACER = "TraceForTest";
    (supervisor.get as any)
      .mockReturnValueOnce(of(formModel))
      .mockReturnValueOnce(of(null));

    //Create
    const view = new SupervisedFormView(supervisor);
    const modelSubscriber = new BehaviorSubject<FormModel | undefined>(
      undefined
    );
    view.$rawModel.subscribe(modelSubscriber);

    expect(modelSubscriber.value).toBeNull();

    view.setId("coolId");

    expect(modelSubscriber.value).not.toBeNull();
    expect(modelSubscriber.value["TRACER"]).toBe("TraceForTest");

    view.setId("nowExpectingNull");
    expect(modelSubscriber.value).toBeNull();
    view.setId(null);
    expect(modelSubscriber.value).toBeNull();

    expect(supervisor.get).toHaveBeenNthCalledWith(1, "coolId");
    expect(supervisor.get).toHaveBeenNthCalledWith(2, "nowExpectingNull");
    expect(supervisor.get).toHaveBeenCalledTimes(2);
  });

  test("model has always a value", () => {
    //Setup
    const adapter = quickMockServerAdapter();
    const supervisor = new FormSupervisor(adapter as ServerAdapter);
    const formModel = new FormModel(
      new BehaviorSubject({ id: "" }),
      new BehaviorSubject({})
    );
    (formModel as any).TRACER = "TraceForTest";
    (supervisor.get as any)
      .mockReturnValueOnce(of(formModel))
      .mockReturnValueOnce(of(null));

    //Create
    const view = new SupervisedFormView(supervisor);
    const initVal = "INITIAL_EMTPY_VALUE";
    const modelSubscriber = new BehaviorSubject<FormModel | string>(initVal);
    view.$model.subscribe(modelSubscriber);

    expect(modelSubscriber.value).toBe(initVal);

    view.setId("coolId");

    expect(modelSubscriber.value).not.toBeNull();
    expect(modelSubscriber.value["TRACER"]).toBe("TraceForTest");

    view.setId("nowExpectingNull");
    expect(modelSubscriber.value).not.toBeNull();
    expect(modelSubscriber.value["TRACER"]).toBe("TraceForTest");

    view.setId(null);
    expect(modelSubscriber.value).not.toBeNull();
    expect(modelSubscriber.value["TRACER"]).toBe("TraceForTest");
  });

  test("existent", () => {
    //Setup
    const adapter = quickMockServerAdapter();
    const supervisor = new FormSupervisor(adapter as ServerAdapter);
    const formModel = new FormModel(
      new BehaviorSubject({ id: "" }),
      new BehaviorSubject({})
    );
    (formModel as any).TRACER = "TraceForTest";
    (supervisor.get as any)
      .mockReturnValueOnce(of(formModel))
      .mockReturnValueOnce(of(null));

    //Create
    const view = new SupervisedFormView(supervisor);
    const initVal = "INITIAL_EMTPY_VALUE";
    const existent = new BehaviorSubject<boolean | string>(initVal);
    view.$existent.subscribe(existent);

    expect(existent.value).toBe(false);

    view.setId("coolId");

    expect(existent.value).toBe(true);

    view.setId("nowExpectingNull");

    expect(existent.value).toBe(false);

    view.setId(null);

    expect(existent.value).toBe(false);
  });

  test("editable", () => {
    //Setup
    const adapter = quickMockServerAdapter();
    const supervisor = new FormSupervisor(adapter as ServerAdapter);
    const formModel = {
      $editable: new BehaviorSubject(true),
    };
    const formModelTwo = {
      $editable: new BehaviorSubject(false),
    };
    (formModel as any).TRACER = "TraceForTest";
    (supervisor.get as any)
      .mockReturnValueOnce(of(formModel))
      .mockReturnValueOnce(of(formModelTwo))
      .mockReturnValueOnce(of(null));

    //Create
    const view = new SupervisedFormView(supervisor);
    const initVal = "INITIAL_EMTPY_VALUE";
    const editable = new BehaviorSubject<boolean | string>(initVal);
    view.$editable.subscribe(editable);

    expect(editable.value).toBe(false);

    view.setId("coolId");
    expect(editable.value).toBe(true);

    formModel.$editable.next(false);
    expect(editable.value).toBe(false);

    formModel.$editable.next(true);
    expect(editable.value).toBe(true);

    view.setId("getFormModelTwo");
    expect(editable.value).toBe(false);

    formModelTwo.$editable.next(true);
    expect(editable.value).toBe(true);

    view.setId("nowExpectingNull");
    expect(editable.value).toBe(false);

    view.setId(null);
    expect(editable.value).toBe(false);
  });

  test("pristine", () => {
    //Setup
    const adapter = quickMockServerAdapter();
    const supervisor = new FormSupervisor(adapter as ServerAdapter);
    const formModel = {
      $pristine: new BehaviorSubject(true),
    };
    const formModelTwo = {
      $pristine: new BehaviorSubject(false),
    };
    (formModel as any).TRACER = "TraceForTest";
    (supervisor.get as any)
      .mockReturnValueOnce(of(formModel))
      .mockReturnValueOnce(of(formModelTwo))
      .mockReturnValueOnce(of(null));

    //Create
    const view = new SupervisedFormView(supervisor);
    const initVal = "INITIAL_EMTPY_VALUE";
    const pristine = new BehaviorSubject<boolean | string>(initVal);
    view.$pristine.subscribe(pristine);

    expect(pristine.value).toBe(initVal);

    view.setId("coolId");
    expect(pristine.value).toBe(true);

    formModel.$pristine.next(false);
    expect(pristine.value).toBe(false);

    formModel.$pristine.next(true);
    expect(pristine.value).toBe(true);

    view.setId("getFormModelTwo");
    expect(pristine.value).toBe(false);

    formModelTwo.$pristine.next(true);
    expect(pristine.value).toBe(true);

    pristine.next(initVal);

    view.setId("nowExpectingNull");
    expect(pristine.value).toBe(initVal);

    view.setId(null);
    expect(pristine.value).toBe(initVal);
  });

  test("activeDataChange", () => {
    //Setup
    const adapter = quickMockServerAdapter();
    const supervisor = new FormSupervisor(adapter as ServerAdapter);
    const formModel = {
      $activeDataChange: new Subject(),
    };
    const formModelTwo = {
      $activeDataChange: new Subject(),
    };
    (supervisor.get as any)
      .mockReturnValueOnce(of(formModel))
      .mockReturnValueOnce(of(formModelTwo))
      .mockReturnValueOnce(of(null));

    //Create
    const view = new SupervisedFormView(supervisor);
    const initVal = "INITIAL_EMTPY_VALUE";
    const formModelDataChange = new BehaviorSubject<boolean | string>(initVal);
    view.$activeDataChange.subscribe(formModelDataChange);

    expect(formModelDataChange.value).toBe(initVal);

    view.setId("coolId");
    expect(formModelDataChange.value).toBe(initVal);

    formModel.$activeDataChange.next("Change1");
    expect(formModelDataChange.value).toBe("Change1");
    formModelDataChange.next(initVal);

    formModelTwo.$activeDataChange.next("Change1");
    expect(formModelDataChange.value).toBe(initVal);

    view.setId("switchToSecond");
    expect(formModelDataChange.value).toBe(initVal);

    formModelTwo.$activeDataChange.next("Change2");
    expect(formModelDataChange.value).toBe("Change2");
    formModelDataChange.next(initVal);
  });

  test("save", async () => {
    //Setup
    const adapter = quickMockServerAdapter();
    const supervisor = new FormSupervisor(adapter as ServerAdapter);
    const view = new SupervisedFormView(supervisor);

    await expect(view.save()).rejects.toEqual(new Error("Cannot save id null"));
    expect(supervisor.save).toHaveBeenCalledTimes(0);

    view.setId("TestId");
    await view.save();
    expect(supervisor.save).toHaveBeenCalledWith("TestId");
  });

  test("delete", async () => {
    //Setup
    const adapter = quickMockServerAdapter();
    const supervisor = new FormSupervisor(adapter as ServerAdapter);
    const view = new SupervisedFormView(supervisor);

    await expect(view.delete()).rejects.toEqual(
      new Error("Cannot delete id null")
    );
    expect(supervisor.save).toHaveBeenCalledTimes(0);

    view.setId("TestId");
    await view.delete();
    expect(supervisor.delete).toHaveBeenCalledWith("TestId");
  });

  test("reset", () => {
    //Setup
    const adapter = quickMockServerAdapter();
    const supervisor = new FormSupervisor(adapter as ServerAdapter);
    const view = new SupervisedFormView(supervisor);

    expect(() => {
      view.reset();
    }).toThrow(/Cannot reset id null/);
    expect(supervisor.save).toHaveBeenCalledTimes(0);

    view.setId("TestId");
    view.reset();
    expect(supervisor.reset).toHaveBeenCalledWith("TestId");
  });
});
