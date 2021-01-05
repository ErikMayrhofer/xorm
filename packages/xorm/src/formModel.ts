import { BehaviorSubject, Observable, combineLatest, Subject } from "rxjs";
import { shareReplay, map } from "rxjs/operators";
import { Mutation } from ".";

export interface FormModelDataBase {
  id: string;
}

function compareFormDatas(a: FormModelDataBase, b: FormModelDataBase) {
  let result = JSON.stringify(a) == JSON.stringify(b);

  console.log("Comparing... ", a, result ? "==" : "!=", b);
  return result;
}

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
