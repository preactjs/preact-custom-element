import {
	h,
	cloneElement,
	render,
	hydrate,
	Fragment,
	AnyComponent,
	ComponentConstructor,
} from 'preact';

type PreactCustomElement = HTMLElement & {
	_root: ShadowRoot | HTMLElement;
	_vdomComponent: AnyComponent;
	_vdom: ReturnType<typeof h> | null;
	_props: Record<string, unknown>;
};

type Options =
	| {
			shadow: false;
	  }
	| {
			shadow: true;
			mode?: 'open' | 'closed';
			adoptedStyleSheets?: CSSStyleSheet[];
			serializable?: boolean;
	  };

interface PrivateData {
	vdomComponent: AnyComponent;
	props: Record<string, unknown> | null;
	vdom: ReturnType<typeof h> | null;
}

interface SlotProps {
	useFragment?: boolean;
	name?: string;
	[key: string]: any;
}

/**
 * Creates a shadow root with serializable support if available
 */
function createShadowRoot(
	element: HTMLElement,
	options: Extract<Options, { shadow: true }>
): ShadowRoot {
	const shadowOptions: ShadowRootInit & { serializable?: boolean } = {
		mode: options.mode || 'open',
	};

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
const privateData = new WeakMap<HTMLElement, PrivateData>();
const PRIMITIVE_TYPES = new Set<string>(['string', 'boolean', 'number']);

/**
 * Register a preact component as web-component.
 */
export default function register<P = {}, S = {}>(
	Component: AnyComponent<P, S>,
	tagName?: string,
	propNames?: (keyof P)[],
	options?: Options
): typeof HTMLElement {
	class PreactElement extends HTMLElement implements PreactCustomElement {
		_root: ShadowRoot | HTMLElement;

		constructor() {
			super();

			// Initialize private data
			privateData.set(this, {
				vdomComponent: Component as AnyComponent,
				props: null,
				vdom: null,
			});

			this._root = options?.shadow ? createShadowRoot(this, options) : this;

			if (options?.shadow && options.adoptedStyleSheets) {
				(this._root as ShadowRoot).adoptedStyleSheets =
					options.adoptedStyleSheets;
			}
		}

		connectedCallback(): void {
			connectedCallback.call(this, options);
		}

		attributeChangedCallback(
			name: string,
			oldValue: string | null,
			newValue: string | null
		): void {
			const data = privateData.get(this);
			if (!data?.vdom) return;

			// Attributes use `null` as an empty value whereas `undefined` is more
			// common in pure JS components, especially with default parameters.
			const processedNewValue = newValue == null ? undefined : newValue;
			const props: Record<string, any> = {};
			props[name] = processedNewValue;
			props[toCamelCase(name)] = processedNewValue;
			data.vdom = cloneElement(data.vdom, props);
			render(data.vdom, this._root);
		}

		disconnectedCallback(): void {
			const data = privateData.get(this);
			if (data) {
				data.vdom = null;
			}
			render(null, this._root);
		}

		// Getter and setter for vdom
		get _vdom(): ReturnType<typeof h> | null {
			return privateData.get(this)?.vdom ?? null;
		}

		set _vdom(value: ReturnType<typeof h> | null) {
			const data = privateData.get(this);
			if (data) {
				data.vdom = value;
			}
		}

		// Getter and setter for props
		get _props(): Record<string, unknown> {
			return privateData.get(this)?.props ?? {};
		}

		set _props(value: Record<string, unknown>) {
			const data = privateData.get(this);
			if (data) {
				data.props = value;
			}
		}

		get _vdomComponent(): AnyComponent {
			return (
				privateData.get(this)?.vdomComponent ?? (Component as AnyComponent)
			);
		}

		static observedAttributes: string[];
		static formAssociated?: boolean;
	}

	/**
	 * @type {string[]}
	 */
	const resolvedPropNames: string[] =
		(propNames as string[]) ||
		(Component as any).observedAttributes ||
		Object.keys((Component as any).propTypes || {});
	PreactElement.observedAttributes = resolvedPropNames;

	if ((Component as any).formAssociated) {
		PreactElement.formAssociated = true;
	}

	// Keep DOM properties and Preact props in sync
	resolvedPropNames.forEach((name: string) => {
		Object.defineProperty(PreactElement.prototype, name, {
			get(this: PreactElement) {
				const data = privateData.get(this);
				return (data?.vdom?.props as any)?.[name] ?? data?.props?.[name];
			},
			set(this: PreactElement, v: any) {
				const data = privateData.get(this);
				if (data?.vdom) {
					this.attributeChangedCallback(name, null, v);
				} else if (data) {
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
		tagName ||
			(Component as any).tagName ||
			(Component as any).displayName ||
			(Component as any).name,
		PreactElement
	);

	return PreactElement as any;
}

function ContextProvider(this: any, props: any) {
	this.getChildContext = () => props.context;
	// eslint-disable-next-line no-unused-vars
	const { context, children, ...rest } = props;
	return cloneElement(children, rest);
}

/**
 * @this {PreactCustomElement}
 */
function connectedCallback(this: PreactCustomElement, options?: Options): void {
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
	this.dispatchEvent(event as any);
	// Context property is added dynamically by event listeners
	const context = (event.detail as any)?.context;

	const data = privateData.get(this);
	if (data) {
		data.vdom = h(
			ContextProvider as any,
			{ ...data.props, context } as any,
			toVdom(this, data.vdomComponent, options)
		);
		(this.hasAttribute('hydrate') ? hydrate : render)(data.vdom, this._root);
	}
}

/**
 * Camel-cases a string
 */
function toCamelCase(str: string): string {
	return str.replace(/-(\w)/g, (_, c) => (c ? c.toUpperCase() : ''));
}

/**
 * Pass an event listener to each `<slot>` that "forwards" the current
 * context value to the rendered child. The child will trigger a custom
 * event, where will add the context value to. Because events work
 * synchronously, the child can immediately pull of the value right
 * after having fired the event.
 */
const slotControllers = new WeakMap<any, AbortController>();

function Slot(this: any, props: SlotProps, context: any) {
	const ref = (r: HTMLElement | null) => {
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

			const listener = (event: Event) => {
				event.stopPropagation();
				// Context is added dynamically to event detail
				(event as any).detail.context = context;
			};

			r.addEventListener('_preact', listener, {
				signal: newController.signal,
			});
		}
	};

	const { useFragment, ...rest } = props;
	return h(useFragment ? Fragment : 'slot', { ...rest, ref } as any);
}

function toVdom(
	element: HTMLElement,
	nodeName: AnyComponent | null,
	options?: Options
): ReturnType<typeof h> | string | null {
	if ((element as any).nodeType === 3) return (element as any).data;
	if ((element as any).nodeType !== 1) return null;

	const children: any[] = [];
	const props: Record<string, any> = {};
	const attributes = element.attributes;
	const childNodes = element.childNodes;

	// Process attributes
	for (let i = attributes.length; i--; ) {
		if (attributes[i].name !== 'slot') {
			props[attributes[i].name] = attributes[i].value;
			props[toCamelCase(attributes[i].name)] = attributes[i].value;
		}
	}

	// Process child nodes
	for (let i = childNodes.length; i--; ) {
		const vnode = toVdom(childNodes[i] as HTMLElement, null, options);
		// Move slots correctly
		const name = (childNodes[i] as any).slot;
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
