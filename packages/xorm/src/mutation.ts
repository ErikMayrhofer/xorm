import { v4 as uuidv4 } from "uuid";
export class Mutation {
  constructor(public message: string) {
    this.clientMutationId = uuidv4();
  }
  clientMutationId: string;
}
let deletedMutation = new Mutation("OBJECT WAS DELETED");
deletedMutation.clientMutationId = "";
export const MUTATION_DELETED = deletedMutation;
