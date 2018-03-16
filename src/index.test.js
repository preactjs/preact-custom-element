import assert from 'assert';
import { h, Component } from 'preact';
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
