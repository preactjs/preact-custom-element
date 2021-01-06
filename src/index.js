import { h, Fragment, cloneElement, render, hydrate } from 'preact';

export default function register(Component, tagName, propNames, options) {
	function PreactElement() {
		const inst = Reflect.construct(HTMLElement, [], PreactElement);
		inst._vdomComponent = Component;
		inst._shadowEnabled = options && options.shadow;
		inst._root = inst._shadowEnabled
			? inst.attachShadow({ mode: 'open' })
			: inst;
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
				if (this._vdom) {
					return this._vdom.props[name];
				}

				if (!this._props) this._props = {};

				return this._props[name];
			},
			set(v) {
				if (this._vdom) {
					this.attributeChangedCallback(name, null, v);
				} else {
					if (!this._props) this._props = {};
					this._props[name] = v;
					this._props[toCamelCase(name)] = v;
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
		toVdom(this, this._vdomComponent, this._shadowEnabled)
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
function Slot(props, context) {
	const { shadow, addContextListener, removeContextListener, ...rest } = props;

	const ref = (r) => {
		if (!r) {
			removeContextListener(this._listener, this.ref);
		} else {
			this.ref = r;
			if (!this._listener) {
				this._listener = (event) => {
					event.stopPropagation();
					event.detail.context = context;
				};
				addContextListener(this._listener, this.ref);
			}
		}
	};

	if (!shadow && !this._listener) {
		this._listener = (event) => {
			event.stopPropagation();
			event.detail.context = context;
		};
		addContextListener(this._listener);
	}

	return h(shadow ? 'slot' : Fragment, { ...rest, ref });
}

function toVdom(element, nodeName, shadow) {
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
		const vnode = toVdom(cn[i], null, shadow);
		// Move slots correctly
		const name = cn[i].slot;
		if (name) {
			props[name] = h(
				Slot,
				{
					name,
					shadow,
					addContextListener(listener, element = cn[i]) {
						element.addEventListener('_preact', listener);
					},
					removeContextListener(listener, element = cn[i]) {
						element.removeEventListener('_preact', listener);
					},
				},
				vnode
			);
		} else {
			children[i] = vnode;
		}
	}

	// Only wrap the topmost node with a slot
	const wrappedProps = {
		shadow,
		addContextListener(listener, e = element) {
			e.addEventListener('_preact', listener);
		},
		removeContextListener(listener, e = element) {
			e.removeEventListener('_preact', listener);
		},
	};

	const wrappedChildren = nodeName ? h(Slot, wrappedProps, children) : children;

	// Remove all children from the topmost node in non-shadow mode
	if (!shadow && nodeName) {
		element.innerHTML = '';
	}

	return h(nodeName || element.nodeName.toLowerCase(), props, wrappedChildren);
}
