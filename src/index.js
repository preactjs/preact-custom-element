import {
	h,
	cloneElement,
	render,
	hydrate,
	options as preactOptions,
} from 'preact';

/**
 * @typedef {import('./internal.d.ts').PreactCustomElement} PreactCustomElement
 */

/**
 * @type {import('./index.d.ts')}
 */
export default function register(Component, tagName, propNames, options) {
	function PreactElement() {
		const inst = /** @type {PreactCustomElement} */ (
			Reflect.construct(HTMLElement, [], PreactElement)
		);
		inst._options = options;
		inst._vdomComponent = Component;

		if (options && options.shadow) {
			inst._root = inst.attachShadow({
				mode: options.mode || 'open',
				serializable: options.serializable ?? false,
			});

			if (options.adoptedStyleSheets) {
				inst._root.adoptedStyleSheets = options.adoptedStyleSheets;
			}
		} else {
			inst._root = inst;
		}

		return inst;
	}
	PreactElement.prototype = Object.create(HTMLElement.prototype);
	PreactElement.prototype.constructor = PreactElement;
	PreactElement.prototype.connectedCallback = connectedCallback;
	PreactElement.prototype.attributeChangedCallback = attributeChangedCallback;
	PreactElement.prototype.disconnectedCallback = disconnectedCallback;

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
				if (this._pendingProps && name in this._pendingProps) {
					return this._pendingProps[name];
				}

				return this._vdom
					? this._vdom.props[name]
					: this._props && this._props[name];
			},
			set(v) {
				if (this._vdom || this.isConnected) {
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
 * @param {PreactCustomElement} element
 */
function createVdom(element) {
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
	element.dispatchEvent(event);
	const context = event.detail.context;

	return h(
		ContextProvider,
		{ ...element._props, context },
		toVdom(element, element._vdomComponent, element._options)
	);
}

/**
 * @this {PreactCustomElement}
 */
function connectedCallback() {
	this._vdom = null;
	enqueueRender(this);
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
 * @param {PreactCustomElement} element
 */
function enqueueRender(element) {
	if (element._renderQueued) return;

	element._renderQueued = true;
	(preactOptions.debounceRendering || queueMicrotask)(() => {
		element._renderQueued = false;
		flushRender(element);
	});
}

/**
 * @param {PreactCustomElement} element
 */
function flushRender(element) {
	if (!element.isConnected) {
		element._pendingProps = null;

		if (!element._vdom) return;

		element._mounted = false;
		render((element._vdom = null), element._root);
		return;
	}

	if (!element._vdom) {
		element._vdom = createVdom(element);
		element._pendingProps = null;
	} else if (element._pendingProps) {
		const props = element._pendingProps;
		element._pendingProps = null;
		element._vdom = cloneElement(element._vdom, props);
	}

	(element._mounted || !element.hasAttribute('hydrate') ? render : hydrate)(
		element._vdom,
		element._root
	);
	element._mounted = true;
}

/**
 * Changed whenver an attribute of the HTML element changed
 * @this {PreactCustomElement}
 * @param {string} name The attribute name
 * @param {unknown} oldValue The old value or undefined
 * @param {unknown} newValue The new value
 */
function attributeChangedCallback(name, oldValue, newValue) {
	// Attributes use `null` as an empty value whereas `undefined` is more
	// common in pure JS components, especially with default parameters.
	// When calling `node.removeAttribute()` we'll receive `null` as the new
	// value. See issue #50.
	newValue = newValue == null ? undefined : newValue;
	if (!this._props) this._props = {};
	this._props[name] = newValue;
	this._props[toCamelCase(name)] = newValue;

	if (this._vdom) {
		if (!this._pendingProps) this._pendingProps = {};
		this._pendingProps[name] = newValue;
		this._pendingProps[toCamelCase(name)] = newValue;
	}

	if (this.isConnected) {
		enqueueRender(this);
	}
}

/**
 * @this {PreactCustomElement}
 */
function disconnectedCallback() {
	enqueueRender(this);
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
	const wrappedChildren =
		nodeName && shadow ? h(Slot, null, children) : children;

	if (!shadow && nodeName) {
		element.innerHTML = '';
	}
	return h(nodeName || element.nodeName.toLowerCase(), props, wrappedChildren);
}
