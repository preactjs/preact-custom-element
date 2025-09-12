import {
	h,
	cloneElement,
	render,
	hydrate,
	Fragment,
	createContext,
} from 'preact';
/**
 * Creates a shadow root with serializable support if available
 */
function createShadowRoot(element, options) {
	const shadowOptions = {
		mode: options.mode || 'open',
	};
	// Add serializable option if requested and supported
	if (options.serializable) {
		shadowOptions.serializable = true;
	}
	try {
		return element.attachShadow(shadowOptions);
	} catch {
		// Fallback for browsers that don't support serializable
		return element.attachShadow({ mode: options.mode || 'open' });
	}
}
// WeakMaps for private instance data
const privateData = new WeakMap();
const PRIMITIVE_TYPES = new Set(['string', 'boolean', 'number']);
/**
 * Register a preact component as web-component.
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
			if (options?.shadow && options.adoptedStyleSheets) {
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
			const processedNewValue = newValue == null ? undefined : newValue;
			const props = {};
			props[name] = processedNewValue;
			props[toCamelCase(name)] = processedNewValue;
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
			return privateData.get(this)?.vdom ?? null;
		}
		set _vdom(value) {
			const data = privateData.get(this);
			if (data) {
				data.vdom = value;
			}
		}
		// Getter and setter for props
		get _props() {
			return privateData.get(this)?.props ?? {};
		}
		set _props(value) {
			const data = privateData.get(this);
			if (data) {
				data.props = value;
			}
		}
		get _vdomComponent() {
			return privateData.get(this)?.vdomComponent ?? Component;
		}
	}
	/**
	 * @type {string[]}
	 */
	const resolvedPropNames =
		propNames ||
		Component.observedAttributes ||
		Object.keys(Component.propTypes || {});
	PreactElement.observedAttributes = resolvedPropNames;
	if (Component.formAssociated) {
		PreactElement.formAssociated = true;
	}
	// Keep DOM properties and Preact props in sync
	resolvedPropNames.forEach((name) => {
		Object.defineProperty(PreactElement.prototype, name, {
			get() {
				const data = privateData.get(this);
				const vdomProps = data?.vdom?.props;
				return vdomProps?.[name] ?? data?.props?.[name];
			},
			set(v) {
				const data = privateData.get(this);
				if (data?.vdom) {
					this.attributeChangedCallback(name, null, String(v));
				} else if (data) {
					if (!data.props) data.props = {};
					data.props[name] = v;
				}
				// Reflect property changes to attributes if the value is a primitive
				const type = typeof v;
				if (v == null || PRIMITIVE_TYPES.has(type)) {
					this.setAttribute(name, String(v));
				}
			},
			enumerable: true,
			configurable: true,
		});
	});
	customElements.define(
		tagName ||
			Component.tagName ||
			Component.displayName ||
			Component.name ||
			'custom-element',
		PreactElement
	);
	return PreactElement;
}
// Create a modern context for passing values between components
const PreactContext = createContext(undefined);
function ContextProvider(props) {
	const { context, children, ...rest } = props;
	// Pass additional props to the child element by cloning it
	const wrappedChild = children ? cloneElement(children, rest) : children;
	return h(PreactContext.Provider, { value: context }, wrappedChild);
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
	// Context property is added dynamically by event listeners
	const context = event.detail?.context;
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
 */
function toCamelCase(str) {
	return str.replace(/-(\w)/g, (_, c) => (c ? c.toUpperCase() : ''));
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
				// Context is added dynamically to event detail
				event.detail.context = context;
			};
			r.addEventListener('_preact', listener, {
				signal: newController.signal,
			});
		}
	};
	const { useFragment, ...rest } = props;
	if (useFragment) {
		// Fragment doesn't accept ref or other props
		return h(Fragment, {});
	} else {
		// Slot element can accept ref and other attributes
		return h('slot', { ...rest, ref });
	}
}
function toVdom(element, nodeName, options) {
	if (element.nodeType === 3) return element.data;
	if (element.nodeType !== 1) return null;
	const htmlElement = element;
	const children = [];
	const props = {};
	const attributes = htmlElement.attributes;
	const childNodes = htmlElement.childNodes;
	// Process attributes
	for (let i = attributes.length; i--; ) {
		if (attributes[i].name !== 'slot') {
			props[attributes[i].name] = attributes[i].value;
			props[toCamelCase(attributes[i].name)] = attributes[i].value;
		}
	}
	// Process child nodes
	for (let i = childNodes.length; i--; ) {
		const vnode = toVdom(childNodes[i], null, options);
		// Move slots correctly
		const name = childNodes[i].slot;
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
		htmlElement.innerHTML = '';
	}
	return h(
		nodeName || htmlElement.nodeName.toLowerCase(),
		props,
		wrappedChildren
	);
}
//# sourceMappingURL=index.js.map
