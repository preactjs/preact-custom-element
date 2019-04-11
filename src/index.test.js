import assert from 'assert';
import { h, Component } from 'preact';
import registerElement from './index';

class Clock extends Component {
	render({ time, customDate }) {
		return <span>{time}, {customDate}</span>;
	}
}
const clockEl = registerElement(Clock, 'x-clock', ['time', 'custom-date']);

it('renders ok, updates on attr change', function() {
	const root = document.createElement('div');
	const el = document.createElement('x-clock');
	el.setAttribute('time', '10:28:57 PM');
	el.setAttribute('custom-date', '11/11/2011');

	root.appendChild(el);
	document.body.appendChild(root);

	assert.equal(
		root.innerHTML,
		'<x-clock time="10:28:57 PM" custom-date="11/11/2011"><span>10:28:57 PM, 11/11/2011</span></x-clock>'
	);

	el.setAttribute('time', '11:01:10 AM');
	el.setAttribute('custom-date', '01/01/2001');

	assert.equal(
		root.innerHTML,
		'<x-clock time="11:01:10 AM" custom-date="01/01/2001"><span>11:01:10 AM, 01/01/2001</span></x-clock>'
	);

	document.body.removeChild(root);
});
