import { h } from 'preact';
import registerElement from '../src/index';

interface AppProps {
	name: string;
}

function App(props: AppProps) {
	return <h1>Hello {props.name}!</h1>;
}

registerElement(App, 'my-app', ['name']);

// @ts-expect-error `bar` is not a valid prop, so it should not be an observed attribute
registerElement(App, 'my-app', ['name', 'bar']);

registerElement(App, 'my-app-shadow', ['name'], {
	shadow: false,
	// @ts-expect-error should not set shadow DOM mode when `shadow` is false
	mode: 'open',
});
