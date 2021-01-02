import { BehaviorSubject } from "rxjs";

function setNewFormValue(obj: any, name: string, value: any) {
  //TODO Deep access via dot-notation in obj
  obj[name] = value;
}

/*
{
  tree: {

  }
  inputs: [

  ]
}


*/
export function htmlElementToModel(node: HTMLElement) {
  let tree = {};
  let inputs = [];

  for (let i = 0; i < node.children.length; i++) {
    let elem = node.children[i];
    if ("value" in elem && "name" in elem && "addEventListener" in elem) {
      let inputElement = elem as HTMLInputElement;
      inputs.push(inputElement);

      let name = inputElement.name;
      let path = name.split(".");

      let treeElement = {};
      let currentLeaf = treeElement;
      for (let element of path) {
        currentLeaf[element] = {};
        currentLeaf = currentLeaf[element];
      }
      currentLeaf[path[path.length - 1]] = inputElement;
      tree = Object.assign(tree, treeElement);

      //inputElement.addEventListener("input", updateView);

      //let initThisValue = initValue[inputElement.name]; //TODO Deep access via dot-notation in obj
      //if (initThisValue !== undefined) {
      //inputElement.value = initThisValue;
      //} else {
      //setNewFormValue(initValue, inputElement.name, inputElement.value);
      //}
      //unregisterMemory.push({
      //element: inputElement,
      //listener: updateView,
      //});
    }
  }
  return {
    tree,
    inputs,
  };
}

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
