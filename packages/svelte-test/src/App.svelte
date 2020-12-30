<script lang="ts">
	export let name: string;
	import { FormModel, FormView, formView, valueSubject } from "./formidable";
	import { BehaviorSubject } from "rxjs";

	let sourceSubject = new BehaviorSubject({});
	let modelA = new FormModel(new BehaviorSubject({}), sourceSubject);
	modelA.value.subscribe((it) => console.log("ModelValueA: ", it));
	let modelB = new FormModel(new BehaviorSubject({}), sourceSubject);
	modelB.value.subscribe((it) => console.log("ModelValueB: ", it));

	let view = new FormView();
	view.setModel(modelA);
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
</style>

<main>
	<h1>Hello {name}!</h1>
	<p>
		Visit the
		<a href="https://svelte.dev/tutorial">Svelte tutorial</a>
		to learn how to build Svelte apps.
	</p>

	<button
		on:click={() => {
			view.setModel(modelA);
		}}>A</button>
	<button
		on:click={() => {
			view.setModel(modelB);
		}}>B</button>

	<form use:formView={view}>
		<label for="name">Name: </label>
		<input name="name" type="text" />
		<label for="age">Age: </label>
		<input name="age" type="number" />
	</form>
	<h1>SourceObject</h1>
	<form use:valueSubject={sourceSubject}>
		<label for="name">Name: </label>
		<input name="name" type="text" />
		<label for="age">Age: </label>
		<input name="age" type="number" />
	</form>
</main>
