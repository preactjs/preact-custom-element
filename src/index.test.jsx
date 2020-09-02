import { assert } from '@open-wc/testing';
import { h, createContext } from 'preact';
import { useContext } from 'preact/hooks';
import { act } from 'preact/test-utils';
import registerElement from './index';

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

	function Clock({ time }) {
		return <span>{time}</span>;
	}

	registerElement(Clock, 'x-clock', ['time', 'custom-date']);

	it('renders ok, updates on attr change', () => {
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

	describe('DOM properties', () => {
		it('passes property changes to props', () => {
			const el = document.createElement('x-clock');

			el.time = '10:28:57 PM';
			assert.equal(el.time, '10:28:57 PM');

			root.appendChild(el);
			assert.equal(
				root.innerHTML,
				'<x-clock time="10:28:57 PM"><span>10:28:57 PM</span></x-clock>'
			);

			el.time = '11:01:10 AM';
			assert.equal(el.time, '11:01:10 AM');

			assert.equal(
				root.innerHTML,
				'<x-clock time="11:01:10 AM"><span>11:01:10 AM</span></x-clock>'
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
		assert.equal(
			root.innerHTML,
			'<x-foo><div>no slot</div><span slot="text">here is a slot</span></x-foo>'
		);

		const shadowHTML = document.querySelector('x-foo').shadowRoot.innerHTML;
		assert.equal(
			shadowHTML,
			'<span class="wrapper"><div class="children"><slot><div>no slot</div></slot></div><div class="slotted"><slot name="text"><span>here is a slot</span></slot></div></span>'
		);
	});

	const kebabName = 'custom-date-long-name';
	const camelName = 'customDateLongName';
	const lowerName = camelName.toLowerCase();
	function PropNameTransform(props) {
		return (
			<span>
				{props[kebabName]} {props[lowerName]} {props[camelName]}
			</span>
		);
	}
	registerElement(PropNameTransform, 'x-prop-name-transform', [
		kebabName,
		camelName,
	]);

	it('handles kebab-case attributes with passthrough', () => {
		const el = document.createElement('x-prop-name-transform');
		el.setAttribute(kebabName, '11/11/2011');
		el.setAttribute(camelName, 'pretended to be camel');

		root.appendChild(el);
		assert.equal(
			root.innerHTML,
			`<x-prop-name-transform ${kebabName}="11/11/2011" ${lowerName}="pretended to be camel"><span>11/11/2011 pretended to be camel 11/11/2011</span></x-prop-name-transform>`
		);

		el.setAttribute(kebabName, '01/01/2001');
		assert.equal(
			root.innerHTML,
			`<x-prop-name-transform ${kebabName}="01/01/2001" ${lowerName}="pretended to be camel"><span>01/01/2001 pretended to be camel 01/01/2001</span></x-prop-name-transform>`
		);
	});

	const Theme = createContext('light');

	function DisplayTheme() {
		const theme = useContext(Theme);
		return <p>Active theme: {theme}</p>;
	}

	registerElement(DisplayTheme, 'x-display-theme', [], { shadow: true });

	function Parent({ children, theme = 'dark' }) {
		return (
			<Theme.Provider value={theme}>
				<div class="children">{children}</div>
			</Theme.Provider>
		);
	}

	registerElement(Parent, 'x-parent', ['theme'], { shadow: true });

	it('passes context over custom element boundaries', async () => {
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

	function Thing() {
		return <span>Hello world!</span>;
	}

	const styleElem = document.createElement('style');
	styleElem.innerHTML = 'span { color: red; }';
	document.head.appendChild(styleElem);

	registerElement(Thing, 'x-thing', undefined, {
		shadow: true,
		injectGlobalStyles: true,
	});

	describe('Global style injections from document.head', () => {
		it('injects style-tags', () => {
			const el = document.createElement('x-thing');

			root.appendChild(el);

			assert.equal(
				document.querySelector('x-thing').shadowRoot.innerHTML,
				'<span>Hello world!</span><style>span { color: red; }</style>'
			);

			const computedStyle = window
				.getComputedStyle(
					document.querySelector('x-thing').shadowRoot.querySelector('span'),
					null
				)
				.getPropertyValue('color');

			assert.equal(computedStyle, 'rgb(255, 0, 0)');

			// assert.equal(
			// 	root.innerHTML,
			// 	'<x-thing><span>Hello world!</span></x-thing>'
			// );
			styleElem.parentElement.removeChild(styleElem);
		});

		it('injects link-tags of rel="stylesheet"', async () => {
			const blob = new Blob([], { type: 'text/css' });

			let linkElementLoaded;

			let deferred;
			let promise = new Promise((resolve) => {
				deferred = resolve;
			});

			const linkElem = document.createElement('link');
			linkElem.rel = 'stylesheet';
			linkElem.href = window.URL.createObjectURL(blob);
			linkElem.onload = () => {
				linkElementLoaded = true;
				deferred();
			};

			document.head.appendChild(linkElem);

			const el = document.createElement('x-thing');

			root.appendChild(el);

			assert.equal(
				document.querySelector('x-thing').shadowRoot.innerHTML,
				`<span>Hello world!</span><link rel="stylesheet" href="${linkElem.href}">`
			);

			await promise;
			assert.isTrue(linkElementLoaded);

			linkElem.parentElement.removeChild(linkElem);
		});

		it('injects link-tags of rel="preload"', async () => {
			const blob = new Blob([], { type: 'text/css' });

			let linkElementLoaded;

			let deferred;
			let promise = new Promise((resolve) => {
				deferred = resolve;
			});

			const linkElem = document.createElement('link');
			linkElem.rel = 'preload';
			linkElem.as = 'style';
			linkElem.href = window.URL.createObjectURL(blob);
			linkElem.onload = () => {
				linkElementLoaded = true;
				deferred();
			};

			document.head.appendChild(linkElem);

			const el = document.createElement('x-thing');

			root.appendChild(el);

			assert.equal(
				document.querySelector('x-thing').shadowRoot.innerHTML,
				`<span>Hello world!</span><link rel="preload" as="style" href="${linkElem.href}">`
			);

			await promise;
			assert.isTrue(linkElementLoaded);

			linkElem.parentElement.removeChild(linkElem);
		});

		it('injects style-tags that is added after custom element is loaded', async () => {
			const el = document.createElement('x-thing');

			root.appendChild(el);

			assert.equal(
				document.querySelector('x-thing').shadowRoot.innerHTML,
				'<span>Hello world!</span>'
			);

			const computedStyle = window
				.getComputedStyle(
					document.querySelector('x-thing').shadowRoot.querySelector('span'),
					null
				)
				.getPropertyValue('color');

			assert.equal(computedStyle, 'rgb(0, 0, 0)');

			const styleElem = document.createElement('style');
			styleElem.innerHTML = 'span { color: red; }';

			// wait for the element to be added
			await new Promise((resolve) => {
				new MutationObserver((mutations, observer) => {
					resolve();
					observer.disconnect();
				}).observe(document.querySelector('x-thing').shadowRoot, {
					childList: true,
					subtree: true,
				});

				document.head.appendChild(styleElem);
			});

			assert.equal(
				document.querySelector('x-thing').shadowRoot.innerHTML,
				'<span>Hello world!</span><style>span { color: red; }</style>'
			);

			styleElem.parentElement.removeChild(styleElem);
		});
	});
});
