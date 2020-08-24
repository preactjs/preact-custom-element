import { h, cloneElement, render, hydrate } from 'preact';

export default function register(Component, tagName, propNames, options) {
	function PreactElement() {
		const inst = Reflect.construct(HTMLElement, [], PreactElement);
		inst._vdomComponent = Component;
		inst._root = options && options.shadow ? inst.attachShadow({ mode: 'open' }) : inst;
		return inst;
	}
	PreactElement.prototype = Object.create(HTMLElement.prototype);
	PreactElement.prototype.constructor = PreactElement;
	PreactElement.prototype.connectedCallback = connectedCallback;
	PreactElement.prototype.attributeChangedCallback = attributeChangedCallback;
	PreactElement.prototype.disconnectedCallback = disconnectedCallback;
	PreactElement.observedAttributes = propNames || Component.observedAttributes || Object.keys(Component.propTypes || {});

	return customElements.define(
		tagName || Component.tagName || Component.displayName || Component.name,
		PreactElement
	);
}

function connectedCallback() {
	this._vdom = toVdom(this, this._vdomComponent);
	(this.hasAttribute('hydrate') ? hydrate : render)(this._vdom, this._root);
}

function toCamelCase(str) {
	return str.replace(/-(\w)/g, function(_, c) {
		return c ? c.toUpperCase() : ''
	});
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
	render(this._vdom = null, this._root);
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
		const vnode = toVdom(cn[i]);
		// Move slots correctly
		const name = cn[i].slot;
		if (name) {
			props[name] = h('slot', { name }, vnode);
		} else {
			children[i] = vnode;
		}
	}
	return h(nodeName || element.nodeName.toLowerCase(), props, children);
}
