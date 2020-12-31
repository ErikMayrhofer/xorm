<script lang="ts">
	import {
		FormModel,
		FormSupervisor,
		formView,
		ServerAdapter,
		valueSubject,
	} from "./formidable";
	import { BehaviorSubject, of, UnsubscriptionError } from "rxjs";
	import MutDisplay from "./MutDisplay.svelte";
	/*
	let sourceSubjectA = new BehaviorSubject({});
	let sourceSubjectB = new BehaviorSubject({});
	let modelA = new FormModel(
		new BehaviorSubject({ name: "", age: 0 }),
		sourceSubjectA
	);
	modelA.value.subscribe((it) => console.log("ModelValueA: ", it));
	let modelB = new FormModel(
		new BehaviorSubject({ name: "", age: 0 }),
		sourceSubjectB
	);
	modelB.value.subscribe((it) => console.log("ModelValueB: ", it));

	let view = new FormView();
	view.setModel(modelA);

	sourceSubjectA.subscribe((it) => console.log("Source A: ", it));
	sourceSubjectB.subscribe((it) => console.log("Source B: ", it));

	*/
	let supervisor = new FormSupervisor(new ServerAdapter());
	let idValue = "";

	let view = supervisor.createView();
	let viewPristine = view.$pristine;
	let viewEditable = view.$editable;
	let viewExistent = view.$existent;
	let viewId = view.$id;

	let model = supervisor.$models;
</script>

<style>
	main {
		text-align: center;
		padding: 1em;
		max-width: 240px;
		margin: 0 auto;
	}

	h1 {
		color: #ff3e00;
		text-transform: uppercase;
		font-size: 4em;
		font-weight: 100;
	}

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}

	.sources {
		display: flex;
		flex-direction: row;
		justify-content: center;
	}
</style>

<main>
	<h1>Form</h1>

	<input bind:value={idValue} />
	<button
		on:click={() => {
			view.setId(idValue);
		}}>ApplyId</button>
	<p>Existent: {$viewExistent}</p>
	<p>Editable: {$viewEditable}</p>

	<form use:formView={view} on:submit|preventDefault={() => view.save()}>
		<h4>Editing: {$viewId}</h4>
		<label for="name">Name: </label>
		<input name="name" type="text" disabled={!$viewEditable} />
		<label for="age">Age: </label>
		<input name="age" type="number" disabled={!$viewEditable} />
		<p>Pristine: {$viewPristine}</p>
		<button type="submit">Save</button>
	</form>

	<button
		on:click={() => {
			supervisor.set(idValue, new FormModel(new BehaviorSubject({
						name: '',
						age: '',
						id: idValue,
					}), new BehaviorSubject({ name: `Id${idValue}`, age: '3' }), true));
		}}>
		Create
		{idValue}
	</button>

	<ul>
		{#each $model as model}
			<li>
				{model.value.value.id}:

				<MutDisplay mutObservable={model.$mutation} />
				<button on:click={() => view.setId(model.value.value.id)}>Edit</button>
				<button
					on:click={() => supervisor.delete(model.value.value.id)}>Delete</button>
			</li>
		{/each}
	</ul>
	<!--
	<h1>SourceObject</h1>
	<div class="sources">
		<form use:valueSubject={sourceSubjectA}>
			<h3>A</h3>
			<label for="name">Name: </label>
			<input name="name" type="text" />
			<label for="age">Age: </label>
			<input name="age" type="number" />
		</form>
		<form use:valueSubject={sourceSubjectB}>
			<h3>B</h3>
			<label for="name">Name: </label>
			<input name="name" type="text" />
			<label for="age">Age: </label>
			<input name="age" type="number" />
		</form>
	</div>
-->
</main>
