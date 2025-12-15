import { h, cloneElement, render, hydrate } from 'preact';

/**
 * @typedef {import('./internal.d.ts').PreactCustomElement} PreactCustomElement
 */

/**
 * @type {import('./index.d.ts').default}
 */
export default function register(Component, tagName, propNames, options) {
	propNames ??= Component.observedAttributes || [];

	class PreactElement extends HTMLElement {
		static formAssociated = Component.formAssociated || false;
		static observedAttributes = propNames;

		constructor() {
			super();

			this._vdomComponent = Component;
			if (options && options.shadow) {
				this._root = this.attachShadow({
					mode: options.mode || 'open',
					serializable: options.serializable ?? false,
				});

				if (options.adoptedStyleSheets) {
					this._root.adoptedStyleSheets = options.adoptedStyleSheets;
				}
			} else {
				this._root = this;
			}
		}

		connectedCallback() {
			connectedCallback.call(this, options);
		}

		/**
		 * Changed whenever an attribute of the HTML element changed
		 *
		 * @param {string} name The attribute name
		 * @param {unknown} oldValue The old value or undefined
		 * @param {unknown} newValue The new value
		 */
		attributeChangedCallback(name, oldValue, newValue) {
			if (!this._vdom) return;
			// Attributes use `null` as an empty value whereas `undefined` is more
			// common in pure JS components, especially with default parameters.
			// When calling `node.removeAttribute()` we'll receive `null` as the new
			// value. See issue #50.
			newValue = newValue == null ? undefined : newValue;
			const props = {};
			props[name] = newValue;
			this._vdom = cloneElement(this._vdom, props);
			render(this._vdom, this._root);
		}

		disconnectedCallback() {
			render((this._vdom = null), this._root);
		}
	}

	// Keep DOM properties and Preact props in sync
	propNames.forEach((name) => {
		Object.defineProperty(PreactElement.prototype, name, {
			get() {
				return this._vdom ? this._vdom.props[name] : this._props[name];
			},
			set(v) {
				if (this._vdom) {
					this.attributeChangedCallback(name, null, v);
				} else {
					if (!this._props) this._props = {};
					this._props[name] = v;
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
	const context = event.detail.context;

	this._vdom = h(
		ContextProvider,
		{ ...this._props, context },
		toVdom(this, this._vdomComponent, options)
	);
	(this.hasAttribute('hydrate') ? hydrate : render)(this._vdom, this._root);
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
	const wrappedChildren =
		nodeName && shadow ? h(Slot, null, children) : children;

	if (!shadow && nodeName) {
		element.innerHTML = '';
	}
	return h(nodeName || element.nodeName.toLowerCase(), props, wrappedChildren);
}
