import assert from 'assert';
import { h, Component, render } from 'preact';
import registerElement from './index';

class Clock extends Component {
	render({ time }) {
		return <span>{time}</span>;
	}
}
const clockEl = registerElement(Clock, 'x-clock', ['time']);

it('renders ok, updates on attr change', function() {
	const root = document.createElement('div');
	const el = document.createElement('x-clock');
	el.setAttribute('time', '10:28:57 PM');

	root.appendChild(el);
	document.body.appendChild(root);

	assert.equal(
		root.innerHTML,
		'<x-clock time="10:28:57 PM"><span>10:28:57 PM</span></x-clock>'
	);

	el.setAttribute('time', '11:01:10 AM');

	assert.equal(
		root.innerHTML,
		'<x-clock time="11:01:10 AM"><span>11:01:10 AM</span></x-clock>'
	);

	document.body.removeChild(root);
});

it('can rerender custom element with preact', function() {
	const root = document.createElement('div');
	document.body.appendChild(root);

	let state = '10:08:07 AM';
	class Clock extends Component {
			render() {
					return state;
			}
	}

	registerElement(Clock, 'x-c');

	function renderApp() {
			render(<x-c/>, root, root.firstElementChild);
	}

	renderApp();
	assert.equal(root.innerHTML, '<x-c>10:08:07 AM</x-c>');
	state = '10:08:08 AM';
	renderApp();
	assert.equal(root.innerHTML, '<x-c>10:08:08 AM</x-c>');

	document.body.removeChild(root);
});
