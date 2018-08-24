import { h, render } from 'preact';

const Empty = () => null;

export default function register(Component, tagName, propNames) {
	function PreactCustomElement() {
		var self = Reflect.construct(HTMLElement, [], PreactCustomElement);
		self._vdomComponent = Component;
		return self;
	}

	PreactCustomElement.prototype = Object.create(HTMLElement.prototype);
	Object.setPrototypeOf(PreactCustomElement, HTMLElement);

	Object.assign(PreactCustomElement.prototype, {
		constructor: PreactCustomElement,
		connectedCallback() {
			renderElement.apply(this);
		},
		attributeChangedCallback() {
			renderElement.apply(this);
		},
		detachedCallback() {
			unRenderElement.apply(this);
		}
	});

	Object.defineProperty(PreactCustomElement, 'observedAttributes', {
		get: () => propNames
	});

	return customElements.define(
		tagName || Component.displayName || Component.name,
		PreactCustomElement
	);
}

function renderElement() {
	this._root = render(toVdom(this, this._vdomComponent), this, this._root);
}

function unRenderElement() {
	render(h(Empty), this, this._root);
}

function toVdom(element, nodeName) {
	if (element.nodeType === 3) return element.nodeValue;
	if (element.nodeType !== 1) return null;
	let children = [],
		props = {},
		i = 0,
		a = element.attributes,
		cn = element.childNodes;
	for (i = a.length; i--; ) props[a[i].name] = a[i].value;
	for (i = cn.length; i--; ) children[i] = toVdom(cn[i]);
	return h(nodeName || element.nodeName.toLowerCase(), props, children);
}
