<script lang="ts">
  import type { BehaviorSubject } from "rxjs";
  import type { Mutation } from "xorm";

  export let mutObservable: BehaviorSubject<Mutation>;

  let mutation = null;
  $: mutation = $mutObservable;
</script>

<p>M: {mutation?.clientMutationId}: {mutation?.message}</p>
