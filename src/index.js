import { h, render } from 'preact';

const Empty = () => null;

export default function register(Component, tagName, propNames) {
	function PreactElement() {
		const inst = Reflect.construct(HTMLElement, [], PreactElement);
		inst._vdomComponent = Component;
		return inst;
	}
	PreactElement.prototype = Object.create(HTMLElement.prototype);
	PreactElement.prototype.constructor = PreactElement;
	PreactElement.prototype.connectedCallback = renderElement;
	PreactElement.prototype.attributeChangedCallback = renderElement;
	PreactElement.prototype.detachedCallback = unRenderElement;
	PreactElement.observedAttributes = propNames;

	return window.customElements.define(
		tagName || Component.displayName || Component.name,
		PreactElement
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
