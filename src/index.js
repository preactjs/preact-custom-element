import { h, cloneElement, render, hydrate } from 'preact';

export default function register(Component, tagName, propNames, options) {
	function PreactElement() {
		const inst = Reflect.construct(HTMLElement, [], PreactElement);
		inst._vdomComponent = Component;
		inst._root =
			options && options.shadow ? inst.attachShadow({ mode: 'open' }) : inst;

		if (options && options.shadow && options.injectGlobalStyles) {
			const defaults = {
				target: document.head,
				selector:
					'style, link[rel="stylesheet"], link[rel="preload"][as="style"]',
				filter: undefined,
				observeOptions: { childList: true, subtree: true },
			};

			this.styleObserver = beginInjectingGlobalStyles(
				inst.shadowRoot,
				/* eslint-disable indent */
				options.injectGlobalStyles === true
					? defaults
					: {
							...defaults,
							...options.injectGlobalStyles,
					  }
				/* eslint-enable indent */
			);
		}

		return inst;
	}
	PreactElement.prototype = Object.create(HTMLElement.prototype);
	PreactElement.prototype.constructor = PreactElement;
	PreactElement.prototype.connectedCallback = connectedCallback;
	PreactElement.prototype.attributeChangedCallback = attributeChangedCallback;
	PreactElement.prototype.disconnectedCallback = disconnectedCallback;

	propNames =
		propNames ||
		Component.observedAttributes ||
		Object.keys(Component.propTypes || {});
	PreactElement.observedAttributes = propNames;

	// Keep DOM properties and Preact props in sync
	propNames.forEach((name) => {
		Object.defineProperty(PreactElement.prototype, name, {
			get() {
				return this._vdom.props[name];
			},
			set(v) {
				if (this._vdom) {
					this.attributeChangedCallback(name, null, v);
				} else {
					if (!this._props) this._props = {};
					this._props[name] = v;
					this.connectedCallback();
				}

				// Reflect property changes to attributes if the value is a primitive
				const type = typeof v;
				if (
					v == null ||
					type === 'string' ||
					type === 'boolean' ||
					type === 'number'
				) {
					this.setAttribute(name, v);
				}
			},
		});
	});

	return customElements.define(
		tagName || Component.tagName || Component.displayName || Component.name,
		PreactElement
	);
}

function ContextProvider(props) {
	this.getChildContext = () => props.context;
	// eslint-disable-next-line no-unused-vars
	const { context, children, ...rest } = props;
	return cloneElement(children, rest);
}

function cloneElementsToShadowRoot(shadowRoot, elements) {
	elements.forEach((el) => shadowRoot.appendChild(el.cloneNode(true)));
}

function getAllStyles(target, selector, filter) {
	const elements = Array.prototype.slice.call(
		target.querySelectorAll(selector)
	);

	return filter ? elements.filter(filter) : elements;
}

const beginInjectingGlobalStyles = (shadowRootRef, injectGlobalStyles) => {
	cloneElementsToShadowRoot(
		shadowRootRef,
		getAllStyles(
			injectGlobalStyles.target,
			injectGlobalStyles.selector,
			injectGlobalStyles.filter
		)
	);

	return observeStyleChanges(
		(elements) => {
			cloneElementsToShadowRoot(shadowRootRef, elements);
		},
		injectGlobalStyles.target,
		injectGlobalStyles.selector,
		injectGlobalStyles.filter,
		injectGlobalStyles.observeOptions
	);
};

function observeStyleChanges(
	callback,
	target,
	selector,
	filter,
	observeOptions
) {
	return new MutationObserver((mutations, observer) => {
		mutations.forEach((mutation) => {
			const matchedElements = Array.prototype.slice
				.call(mutation.addedNodes)
				.filter((node) => node.matches && node.matches(selector));

			if (matchedElements.length > 0) {
				callback(filter ? matchedElements.filter(filter) : matchedElements);
			}
		});
	}).observe(target, observeOptions);
}

function connectedCallback() {
	// Obtain a reference to the previous context by pinging the nearest
	// higher up node that was rendered with Preact. If one Preact component
	// higher up receives our ping, it will set the `detail` property of
	// our custom event. This works because events are dispatched
	// synchronously.
	const event = new CustomEvent('_preact', {
		detail: {},
		bubbles: true,
		cancelable: true,
	});
	this.dispatchEvent(event);
	const context = event.detail.context;

	this._vdom = h(
		ContextProvider,
		{ ...this._props, context },
		toVdom(this, this._vdomComponent)
	);
	(this.hasAttribute('hydrate') ? hydrate : render)(this._vdom, this._root);
}

function toCamelCase(str) {
	return str.replace(/-(\w)/g, (_, c) => (c ? c.toUpperCase() : ''));
}

function attributeChangedCallback(name, oldValue, newValue) {
	if (!this._vdom) return;
	const props = {};
	props[name] = newValue;
	props[toCamelCase(name)] = newValue;
	this._vdom = cloneElement(this._vdom, props);
	render(this._vdom, this._root);
}

function disconnectedCallback() {
	render((this._vdom = null), this._root);

	if (this.styleObserver) {
		this.styleObserver.disconnect();
	}
}

/**
 * Pass an event listener to each `<slot>` that "forwards" the current
 * context value to the rendered child. The child will trigger a custom
 * event, where will add the context value to. Because events work
 * synchronously, the child can immediately pull of the value right
 * after having fired the event.
 */
function Slot(props, context) {
	const ref = (r) => {
		if (!r) {
			this.ref.removeEventListener('_preact', this._listener);
		} else {
			this.ref = r;
			if (!this._listener) {
				this._listener = (event) => {
					event.stopPropagation();
					event.detail.context = context;
				};
				r.addEventListener('_preact', this._listener);
			}
		}
	};
	return h('slot', { ...props, ref });
}

function toVdom(element, nodeName) {
	if (element.nodeType === 3) return element.data;
	if (element.nodeType !== 1) return null;
	let children = [],
		props = {},
		i = 0,
		a = element.attributes,
		cn = element.childNodes;
	for (i = a.length; i--; ) {
		if (a[i].name !== 'slot') {
			props[a[i].name] = a[i].value;
			props[toCamelCase(a[i].name)] = a[i].value;
		}
	}

	for (i = cn.length; i--; ) {
		const vnode = toVdom(cn[i], null);
		// Move slots correctly
		const name = cn[i].slot;
		if (name) {
			props[name] = h(Slot, { name }, vnode);
		} else {
			children[i] = vnode;
		}
	}

	// Only wrap the topmost node with a slot
	const wrappedChildren = nodeName ? h(Slot, null, children) : children;
	return h(nodeName || element.nodeName.toLowerCase(), props, wrappedChildren);
}
