import assert from 'assert';
import { h } from 'preact';
import registerElement from './index';

function Clock ({ time }) {
	return <span>{time}</span>;
}

registerElement(Clock, 'x-clock', ['time', 'custom-date']);

it('renders ok, updates on attr change', () => {
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

function Foo({ text, children }) {
	return (
		<span class="wrapper">
			<div class="children">{children}</div>
			<div class="slotted">{text}</div>
		</span>
	);
}

registerElement(Foo, 'x-foo', [], { shadow: true });

it('renders slots as props with shadow DOM', () => {
	const root = document.createElement('div');
	const el = document.createElement('x-foo');

	// <span slot="text">here is a slot</span>
	const slot = document.createElement('span');
	slot.textContent = 'here is a slot';
	slot.slot = 'text';
	el.appendChild(slot);

	// <div>no slot</div>
	const noSlot = document.createElement('div');
	noSlot.textContent = 'no slot';
	el.appendChild(noSlot);
	el.appendChild(slot);

	root.appendChild(el);
	document.body.appendChild(root);

	assert.equal(root.innerHTML, '<x-foo><div>no slot</div><span slot="text">here is a slot</span></x-foo>');

	const shadowHTML = document.querySelector('x-foo').shadowRoot.innerHTML;
	assert.equal(shadowHTML, '<span class="wrapper"><div class="children"><div>no slot</div></div><div class="slotted"><slot name="text"><span>here is a slot</span></slot></div></span>');

	document.body.removeChild(root);
});

const kebabName = 'custom-date-long-name';
const camelName = 'customDateLongName';
const lowerName = camelName.toLowerCase();
function PropNameTransform (props) {
	return <span>{props[kebabName]} {props[lowerName]} {props[camelName]}</span>;
}
registerElement(PropNameTransform , 'x-prop-name-transform', [kebabName, camelName]);

it('handles kebab-case attributes with passthrough', () => {
	const root = document.createElement('div');
	const el = document.createElement('x-prop-name-transform');
	el.setAttribute(kebabName, '11/11/2011');
	el.setAttribute(camelName, 'pretended to be camel');

	root.appendChild(el);
	document.body.appendChild(root);

	assert.equal(
		root.innerHTML,
		`<x-prop-name-transform ${kebabName}="11/11/2011" ${lowerName}="pretended to be camel"><span>11/11/2011 pretended to be camel 11/11/2011</span></x-prop-name-transform>`
	);

	el.setAttribute(kebabName, '01/01/2001');

	assert.equal(
		root.innerHTML,
		`<x-prop-name-transform ${kebabName}="01/01/2001" ${lowerName}="pretended to be camel"><span>01/01/2001 pretended to be camel 01/01/2001</span></x-prop-name-transform>`
	);

	document.body.removeChild(root);
});
