import { h, cloneElement, render } from 'preact';

export default function register(Component, tagName, propNames) {
	function PreactElement() {
		const inst = Reflect.construct(HTMLElement, [], PreactElement);
		inst._vdomComponent = Component;
		return inst;
	}
	PreactElement.prototype = Object.create(HTMLElement.prototype);
	PreactElement.prototype.constructor = PreactElement;
	PreactElement.prototype.connectedCallback = connectedCallback;
	PreactElement.prototype.attributeChangedCallback = attributeChangedCallback;
	PreactElement.prototype.detachedCallback = detachedCallback;
	propNames = propNames || Component.observedAttributes || Object.keys(Component.propTypes || {});
	PreactElement.observedAttributes = propNames;
	propNames.forEach(name => {
		Object.defineProperty(PreactElement.prototype, name, {
			get() { return this._vdom.props[name]; },
			set(v) { this.attributeChangedCallback(name, null, v); }
		});
	})

	return customElements.define(
		tagName || Component.tagName || Component.displayName || Component.name,
		PreactElement
	);
}

function connectedCallback() {
	this._vdom = toVdom(this, this._vdomComponent);
	render(this._vdom, this);
}

function attributeChangedCallback(name, oldValue, newValue) {
	if (!this._vdom) return;
	const props = {};
	props[name] = newValue;
	this._vdom = cloneElement(this._vdom, props);
	render(this._vdom, this);
}

function detachedCallback() {
	render(this._vdom = null, this);
}

function toVdom(element, nodeName) {
	if (element.nodeType === 3) return element.data;
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
