import { assert } from '@open-wc/testing';
import { h, createContext, Fragment } from 'preact';
import { useContext } from 'preact/hooks';
import { act } from 'preact/test-utils';
import registerElement from '../../src/index';

describe('web components', () => {
	/** @type {HTMLDivElement} */
	let root;

	beforeEach(() => {
		root = document.createElement('div');
		document.body.appendChild(root);
	});

	afterEach(() => {
		document.body.removeChild(root);
	});

	it('renders ok, updates on attr change', () => {
		function Clock({ time }) {
			return <span>{time}</span>;
		}

		registerElement(Clock, 'x-clock', ['time']);

		const el = document.createElement('x-clock');
		el.setAttribute('time', '10:28:57 PM');

		root.appendChild(el);
		assert.equal(
			root.innerHTML,
			'<x-clock time="10:28:57 PM"><span>10:28:57 PM</span></x-clock>'
		);

		el.setAttribute('time', '11:01:10 AM');
		assert.equal(
			root.innerHTML,
			'<x-clock time="11:01:10 AM"><span>11:01:10 AM</span></x-clock>'
		);
	});

	// #50
	it('remove attributes without crashing', () => {
		function NullProps({ size = 'md' }) {
			return <div>{size.toUpperCase()}</div>;
		}

		registerElement(NullProps, 'x-null-props', ['size'], { shadow: true });

		const el = document.createElement('x-null-props');
		assert.doesNotThrow(() => (el.size = 'foo'));
		root.appendChild(el);

		assert.doesNotThrow(() => el.removeAttribute('size'));
	});

	describe('DOM properties', () => {
		it('passes property changes to props', () => {
			function Clock({ time }) {
				return <span>{time}</span>;
			}

			registerElement(Clock, 'x-clock-props', ['time']);

			const el = document.createElement('x-clock-props');

			el.time = '10:28:57 PM';
			assert.equal(el.time, '10:28:57 PM');

			root.appendChild(el);
			assert.equal(
				root.innerHTML,
				'<x-clock-props time="10:28:57 PM"><span>10:28:57 PM</span></x-clock-props>'
			);

			el.time = '11:01:10 AM';
			assert.equal(el.time, '11:01:10 AM');

			assert.equal(
				root.innerHTML,
				'<x-clock-props time="11:01:10 AM"><span>11:01:10 AM</span></x-clock-props>'
			);
		});

		function DummyButton({ onClick, text = 'click' }) {
			return <button onClick={onClick}>{text}</button>;
		}

		registerElement(DummyButton, 'x-dummy-button', ['onClick', 'text']);

		it('passes simple properties changes to props', () => {
			const el = document.createElement('x-dummy-button');

			el.text = 'foo';
			assert.equal(el.text, 'foo');

			root.appendChild(el);
			assert.equal(
				root.innerHTML,
				'<x-dummy-button text="foo"><button>foo</button></x-dummy-button>'
			);

			// Update
			el.text = 'bar';
			assert.equal(
				root.innerHTML,
				'<x-dummy-button text="bar"><button>bar</button></x-dummy-button>'
			);
		});

		it('passes complex properties changes to props', () => {
			const el = document.createElement('x-dummy-button');

			let clicks = 0;
			const onClick = () => clicks++;
			el.onClick = onClick;
			assert.equal(el.onClick, onClick);

			root.appendChild(el);
			assert.equal(
				root.innerHTML,
				'<x-dummy-button><button>click</button></x-dummy-button>'
			);

			act(() => {
				el.querySelector('button').click();
			});
			assert.equal(clicks, 1);

			// Update
			let other = 0;
			el.onClick = () => other++;
			act(() => {
				el.querySelector('button').click();
			});
			assert.equal(other, 1);
		});

		it('sets complex property after other property', () => {
			const el = document.createElement('x-dummy-button');

			// set simple property first
			el.text = 'click me';

			let clicks = 0;
			const onClick = () => clicks++;
			el.onClick = onClick;

			assert.equal(el.text, 'click me');
			assert.equal(el.onClick, onClick);

			root.appendChild(el);
			assert.equal(
				root.innerHTML,
				'<x-dummy-button text="click me"><button>click me</button></x-dummy-button>'
			);

			act(() => {
				el.querySelector('button').click();
			});

			assert.equal(el.onClick, onClick);
			assert.equal(clicks, 1);
		});
	});

	it('renders slots as props with shadow DOM', () => {
		function Slots({ text, children }) {
			return (
				<span class="wrapper">
					<div class="children">{children}</div>
					<div class="slotted">{text}</div>
				</span>
			);
		}

		registerElement(Slots, 'x-slots', [], { shadow: true });

		const el = document.createElement('x-slots');

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
		assert.equal(
			root.innerHTML,
			'<x-slots><div>no slot</div><span slot="text">here is a slot</span></x-slots>'
		);

		const shadowHTML = document.querySelector('x-slots').shadowRoot.innerHTML;
		assert.equal(
			shadowHTML,
			'<span class="wrapper"><div class="children"><slot><div>no slot</div></slot></div><div class="slotted"><slot name="text"><span>here is a slot</span></slot></div></span>'
		);
	});

	describe('children', () => {
		/** @param {string} name */
		function createTestElement(name) {
			const el = document.createElement(name);
			const child1 = document.createElement('p');
			child1.textContent = 'Child 1';
			const child2 = document.createElement('p');
			child2.textContent = 'Child 2';
			el.appendChild(child1);
			el.appendChild(child2);
			return el;
		}

		it('supports controlling light DOM children', () => {
			function LightDomChildren({ children }) {
				return (
					<Fragment>
						<h1>Light DOM Children</h1>
						<div>{children}</div>
					</Fragment>
				);
			}

			registerElement(LightDomChildren, 'light-dom-children', []);
			registerElement(LightDomChildren, 'light-dom-children-shadow-false', [], {
				shadow: false,
			});

			root.appendChild(createTestElement('light-dom-children'));
			root.appendChild(createTestElement('light-dom-children-shadow-false'));

			assert.equal(
				document.querySelector('light-dom-children').innerHTML,
				'<h1>Light DOM Children</h1><div><p>Child 1</p><p>Child 2</p></div>'
			);
			assert.equal(
				document.querySelector('light-dom-children-shadow-false').innerHTML,
				'<h1>Light DOM Children</h1><div><p>Child 1</p><p>Child 2</p></div>'
			);
		});

		it('supports controlling shadow DOM children', () => {
			function ShadowDomChildren({ children }) {
				return (
					<Fragment>
						<h1>Light DOM Children</h1>
						<div>{children}</div>
					</Fragment>
				);
			}

			registerElement(ShadowDomChildren, 'shadow-dom-children', [], {
				shadow: true,
			});

			root.appendChild(createTestElement('shadow-dom-children'));

			assert.equal(
				document.querySelector('shadow-dom-children').shadowRoot.innerHTML,
				'<h1>Light DOM Children</h1><div><slot><p>Child 1</p><p>Child 2</p></slot></div>'
			);
		});
	});

	describe('context', () => {
		const Theme = createContext('light');

		function DisplayTheme() {
			const theme = useContext(Theme);
			return <p>Active theme: {theme}</p>;
		}

		function Parent({ children, theme = 'dark' }) {
			return (
				<Theme.Provider value={theme}>
					<div class="children">{children}</div>
				</Theme.Provider>
			);
		}

		registerElement(Parent, 'x-parent', ['theme'], { shadow: true });
		registerElement(DisplayTheme, 'x-display-theme', [], { shadow: true });

		it('passes context over custom element boundaries', () => {
			const el = document.createElement('x-parent');

			const noSlot = document.createElement('x-display-theme');
			el.appendChild(noSlot);

			root.appendChild(el);
			assert.equal(
				root.innerHTML,
				'<x-parent><x-display-theme></x-display-theme></x-parent>'
			);

			const getShadowHTML = () =>
				document.querySelector('x-display-theme').shadowRoot.innerHTML;
			assert.equal(getShadowHTML(), '<p>Active theme: dark</p>');

			// Trigger context update
			act(() => {
				el.setAttribute('theme', 'sunny');
			});
			assert.equal(getShadowHTML(), '<p>Active theme: sunny</p>');
		});
	});
});
