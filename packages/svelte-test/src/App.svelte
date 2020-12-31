<script lang="ts">
	import { FormModel, FormView, formView, valueSubject } from "./formidable";
	import { BehaviorSubject } from "rxjs";

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

	let viewPristine = view.$pristine;
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
		<p>Valid: {$viewPristine}</p>
	</form>
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
</main>
