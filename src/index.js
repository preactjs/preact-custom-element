import { h, cloneElement, render, hydrate, Fragment } from 'preact';

// This function is used to register a component with the given tag name.
export default function register(Component, tagName, propNames, options) {
	// Create an instance of PreactElement, which extends HTMLElement.
	function PreactElement() {
		const inst = Reflect.construct(HTMLElement, [], PreactElement);
		inst._vdomComponent = Component;

		// If options for shadow DOM are given, attach a shadow root.
		// Otherwise, assign the instance itself as root.
		inst._root =
			options && options.shadow ? inst.attachShadow({ mode: 'open' }) : inst;

		return inst;
	}

	// Extend the PreactElement from HTMLElement.
	PreactElement.prototype = Object.create(HTMLElement.prototype);
	PreactElement.prototype.constructor = PreactElement;

	// Assign lifecycle methods to the PreactElement.
	PreactElement.prototype.connectedCallback = function () {
		connectedCallback.call(this, options);
	};
	PreactElement.prototype.attributeChangedCallback = attributeChangedCallback;
	PreactElement.prototype.disconnectedCallback = disconnectedCallback;

	// Assign observed attributes.
	propNames =
		propNames ||
		Component.observedAttributes ||
		Object.keys(Component.propTypes || {});
	PreactElement.observedAttributes = propNames;

	// Sync DOM properties and Preact props.
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

				// Reflect property changes to attributes if the value is a primitive.
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

	// Define the custom element.
	return customElements.define(
		tagName || Component.tagName || Component.displayName || Component.name,
		PreactElement
	);
}

// The rest of the functions are utility functions used within the register function.

// This function provides the context for child components.
function ContextProvider(props) {
	this.getChildContext = () => props.context;
	// eslint-disable-next-line no-unused-vars
	const { context, children, ...rest } = props;
	return cloneElement(children, rest);
}

// This function is called when the custom element is inserted into the DOM
function connectedCallback(options) {
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
		toVdom(this, this._vdomComponent, options)
	);
	(this.hasAttribute('hydrate') ? hydrate : render)(this._vdom, this._root);
}

function toCamelCase(str) {
	return str.replace(/-(\w)/g, (_, c) => (c ? c.toUpperCase() : ''));
}

function attributeChangedCallback(name, oldValue, newValue) {
	if (!this._vdom) return;
	// Attributes use `null` as an empty value whereas `undefined` is more
	// common in pure JS components, especially with default parameters.
	// When calling `node.removeAttribute()` we'll receive `null` as the new
	// value. See issue #50.
	newValue = newValue == null ? undefined : newValue;
	const props = {};
	props[name] = newValue;
	props[toCamelCase(name)] = newValue;
	this._vdom = cloneElement(this._vdom, props);
	render(this._vdom, this._root);
}

function disconnectedCallback() {
	render((this._vdom = null), this._root);
}

/**
 * Pass an event listener to each `<slot>` that "forwards" the current
 * context value to the rendered child. The child will trigger a custom
 * event, where will add the context value to. Because events work
 * synchronously, the child can immediately pull of the value right
 * after having fired the event.
 */
// This function provides a slot for context propagation.
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

// This function provides a pseudo-slot for context propagation without shadow dom.
function PseudoSlot(props, context) {
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
	return h(Fragment, { ...props, ref });
}

// This function converts DOM elements to virtual DOM.
function toVdom(element, nodeName, options) {
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
		const vnode = toVdom(cn[i], null, options);
		// Move slots correctly
		const name = cn[i].slot;
		if (name) {
			props[name] = h(Slot, { name }, vnode);
		} else {
			children[i] = vnode;
		}
	}

	// Only wrap the topmost node with a slot

	const wrappedChildren = nodeName
		? h(options && options.shadow === false ? PseudoSlot : Slot, null, children)
		: children;

	if (options && options.shadow === false && nodeName) {
		const lastChildElement = element.lastChild;
		element.removeChild(lastChildElement);
	}
	return h(nodeName || element.nodeName.toLowerCase(), props, wrappedChildren);
}
