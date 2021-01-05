import { ServerAdapter, FormSupervisor, FormModel } from "../lib/index";
import { BehaviorSubject } from "rxjs";
import { valueSubject } from "../src/bindValue";

describe("bindValue", () => {
  describe("shallowObject", () => {
    beforeEach(() => {
      document.body.innerHTML = `
            <form id="formUnderTest">
		        <label for="name">Name: </label>
		        <input name="name" type="text" id="nameField"/>
		        <label for="age">Age: </label>
		        <input name="age" type="number" id="ageField"/>
		        <button type="submit">Save</button>
		        <button type="button">Cancel</button>
            </form>
        
        `;
    });

    test("canReadValue", () => {
      let form = document.getElementById("formUnderTest");

      let subject = new BehaviorSubject({});

      valueSubject(form, subject);

      expect(subject.value).toStrictEqual({ name: "", age: "" });
    });
    test("canPlaceValue", () => {
      let form = document.getElementById("formUnderTest");
      let nameInput = document.getElementById("nameField") as HTMLInputElement;
      let ageInput = document.getElementById("ageField") as HTMLInputElement;

      let subject = new BehaviorSubject({ name: "nameValue", age: "33" });

      valueSubject(form, subject);

      expect(subject.value).toStrictEqual({
        name: "nameValue",
        age: "33",
      });
      expect(nameInput.value).toEqual("nameValue");
      expect(ageInput.value).toEqual("33");
    });
    test("canUpdateValue", () => {
      let form = document.getElementById("formUnderTest");
      let nameInput = document.getElementById("nameField") as HTMLInputElement;
      let ageInput = document.getElementById("ageField") as HTMLInputElement;

      let subject = new BehaviorSubject({ name: "nameValue", age: "33" });

      valueSubject(form, subject);

      expect(subject.value).toStrictEqual({
        name: "nameValue",
        age: "33",
      });

      nameInput.value = "newNameValue";
      nameInput.dispatchEvent(new Event("input"));
      ageInput.value = "11";
      ageInput.dispatchEvent(new Event("input"));

      expect(subject.value).toStrictEqual({
        name: "newNameValue",
        age: "11",
      });
    });
    test("unbind", () => {
      let form = document.getElementById("formUnderTest");
      let nameInput = document.getElementById("nameField") as HTMLInputElement;
      let ageInput = document.getElementById("ageField") as HTMLInputElement;

      let subjectA = new BehaviorSubject({ name: "nameValueA", age: "33" });
      let subjectB = new BehaviorSubject({ name: "nameValueB", age: "44" });

      //a1 BIND A
      //a2 check that a hasn't changed
      //a3 change form
      //a4 check that a has been updated
      //b1 UNBIND A, BIND B
      //b2 check that a and b have not changed
      //b3 check that form has values from B
      //b4 change form
      //b5 check that b has been updated
      //b6 check that a hasn't changed

      //a1
      let unbind = valueSubject(form, subjectA);

      //a2
      expect(subjectA.value).toStrictEqual({
        name: "nameValueA",
        age: "33",
      });

      //a3
      nameInput.value = "newNameValue";
      nameInput.dispatchEvent(new Event("input"));
      ageInput.value = "11";
      ageInput.dispatchEvent(new Event("input"));

      //a4
      expect(subjectA.value).toStrictEqual({
        name: "newNameValue",
        age: "11",
      });

      //b1
      unbind();
      unbind = valueSubject(form, subjectB);

      //b2
      expect(subjectA.value).toStrictEqual({
        name: "newNameValue",
        age: "11",
      });
      expect(subjectB.value).toStrictEqual({
        name: "nameValueB",
        age: "44",
      });

      //b3
      expect(nameInput.value).toBe("nameValueB");
      expect(ageInput.value).toBe("44");

      //b4
      nameInput.value = "newNameBValue";
      nameInput.dispatchEvent(new Event("input"));
      ageInput.value = "99";
      ageInput.dispatchEvent(new Event("input"));

      //b5
      expect(subjectB.value).toStrictEqual({
        name: "newNameBValue",
        age: "99",
      });

      //b6
      expect(subjectA.value).toStrictEqual({
        name: "newNameValue",
        age: "11",
      });
    });
  });
});
