import { FunctionComponent, h } from 'preact';
import registerElement from '../src/index';

interface AppProps {
	firstName: string;
	lastName: string;
}

function App(props: AppProps) {
	return (
		<h1>
			Hello {props.firstName} {props.lastName}!
		</h1>
	);
}

registerElement(App, 'my-app', ['first-name', 'last-name']);

// @ts-expect-error `bar` is not a valid prop, so it should not be an observed attribute
registerElement(App, 'my-app', ['first-name', 'last-name', 'bar']);

// @ts-expect-error props in camelcase are not valid
registerElement(App, 'my-app', ['firstName', 'lastName']);

registerElement(App, 'my-app-shadow', ['first-name', 'last-name'], {
	shadow: false,
	// @ts-expect-error should not set shadow DOM mode when `shadow` is false
	mode: 'open',
});
