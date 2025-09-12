import { h, cloneElement, render, hydrate, Fragment } from 'preact';

/**
 * @typedef {import('./index.d.ts').PreactCustomElement} PreactCustomElement
 */

/**
 * Creates a shadow root with serializable support if available
 * @param {HTMLElement} element - The element to attach the shadow to
 * @param {object} options - Shadow root options
 * @returns {ShadowRoot} The created shadow root
 */
function createShadowRoot(element, options) {
	const shadowOptions = { mode: options.mode || 'open' };

	// Add serializable option if requested and supported
	if (options.serializable) {
		shadowOptions.serializable = true;
	}

	try {
		return element.attachShadow(shadowOptions);
	} catch (e) {
		// Fallback for browsers that don't support serializable
		return element.attachShadow({ mode: options.mode || 'open' });
	}
}

// WeakMaps for private instance data
const privateData = new WeakMap();
const PRIMITIVE_TYPES = new Set(['string', 'boolean', 'number']);

/**
 * @type {import('./index.d.ts').default}
 */
export default function register(Component, tagName, propNames, options) {
	class PreactElement extends HTMLElement {
		constructor() {
			super();

			// Initialize private data
			privateData.set(this, {
				vdomComponent: Component,
				props: null,
				vdom: null,
			});

			this._root = options?.shadow ? createShadowRoot(this, options) : this;

			if (options?.adoptedStyleSheets) {
				this._root.adoptedStyleSheets = options.adoptedStyleSheets;
			}
		}

		connectedCallback() {
			connectedCallback.call(this, options);
		}

		attributeChangedCallback(name, oldValue, newValue) {
			const data = privateData.get(this);
			if (!data?.vdom) return;

			// Attributes use `null` as an empty value whereas `undefined` is more
			// common in pure JS components, especially with default parameters.
			newValue = newValue == null ? undefined : newValue;
			const props = {};
			props[name] = newValue;
			props[toCamelCase(name)] = newValue;
			data.vdom = cloneElement(data.vdom, props);
			render(data.vdom, this._root);
		}

		disconnectedCallback() {
			const data = privateData.get(this);
			if (data) {
				data.vdom = null;
			}
			render(null, this._root);
		}

		// Getter and setter for vdom
		get _vdom() {
			return privateData.get(this)?.vdom;
		}

		set _vdom(value) {
			const data = privateData.get(this);
			if (data) {
				data.vdom = value;
			}
		}

		// Getter and setter for props
		get _props() {
			return privateData.get(this)?.props;
		}

		set _props(value) {
			const data = privateData.get(this);
			if (data) {
				data.props = value;
			}
		}

		get _vdomComponent() {
			return privateData.get(this)?.vdomComponent;
		}
	}

	/**
	 * @type {string[]}
	 */
	propNames =
		propNames ||
		Component.observedAttributes ||
		Object.keys(Component.propTypes || {});
	PreactElement.observedAttributes = propNames;

	if (Component.formAssociated) {
		PreactElement.formAssociated = true;
	}

	// Keep DOM properties and Preact props in sync
	propNames.forEach((name) => {
		Object.defineProperty(PreactElement.prototype, name, {
			get() {
				const data = privateData.get(this);
				return data?.vdom?.props[name] ?? data?.props?.[name];
			},
			set(v) {
				const data = privateData.get(this);
				if (data?.vdom) {
					this.attributeChangedCallback(name, null, v);
				} else {
					if (!data.props) data.props = {};
					data.props[name] = v;
				}

				// Reflect property changes to attributes if the value is a primitive
				const type = typeof v;
				if (v == null || PRIMITIVE_TYPES.has(type)) {
					this.setAttribute(name, v);
				}
			},
			enumerable: true,
			configurable: true,
		});
	});

	customElements.define(
		tagName || Component.tagName || Component.displayName || Component.name,
		PreactElement
	);

	return PreactElement;
}

function ContextProvider(props) {
	this.getChildContext = () => props.context;
	// eslint-disable-next-line no-unused-vars
	const { context, children, ...rest } = props;
	return cloneElement(children, rest);
}

/**
 * @this {PreactCustomElement}
 */
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
	// @ts-ignore - context property is added dynamically by event listeners
	const context = event.detail && event.detail.context;

	const data = privateData.get(this);
	if (data) {
		data.vdom = h(
			ContextProvider,
			{ ...data.props, context },
			toVdom(this, data.vdomComponent, options)
		);
		(this.hasAttribute('hydrate') ? hydrate : render)(data.vdom, this._root);
	}
}

/**
 * Camel-cases a string
 * @param {string} str The string to transform to camelCase
 * @returns camel case version of the string
 */
function toCamelCase(str) {
	return str.replace(/-(\w)/g, (_, c) => (c ? c.toUpperCase() : ''));
}

/**
 * Changed whenver an attribute of the HTML element changed
 * @this {PreactCustomElement}
 * @param {string} name The attribute name
 * @param {unknown} oldValue The old value or undefined
 * @param {unknown} newValue The new value
 */
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

/**
 * @this {PreactCustomElement}
 */
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
const slotControllers = new WeakMap();

function Slot(props, context) {
	const ref = (r) => {
		const controller = slotControllers.get(this);

		if (!r) {
			// Cleanup: abort the controller to remove all listeners
			if (controller) {
				controller.abort();
				slotControllers.delete(this);
			}
		} else {
			// Setup: create new AbortController for this slot
			const newController = new AbortController();
			slotControllers.set(this, newController);

			const listener = (event) => {
				event.stopPropagation();
				// @ts-ignore - we know context exists in this scope
				event.detail.context = context;
			};

			r.addEventListener('_preact', listener, {
				signal: newController.signal,
			});
		}
	};

	const { useFragment, ...rest } = props;
	return h(useFragment ? Fragment : 'slot', { ...rest, ref });
}

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

	const shadow = !!(options && options.shadow);

	// Only wrap the topmost node with a slot
	const wrappedChildren = nodeName
		? h(Slot, { useFragment: !shadow }, children)
		: children;

	if (!shadow && nodeName) {
		element.innerHTML = '';
	}
	return h(nodeName || element.nodeName.toLowerCase(), props, wrappedChildren);
}
