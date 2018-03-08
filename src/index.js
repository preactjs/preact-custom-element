import { h, render } from 'preact';

const Empty = () => null;

function toVdom(element, nodeName) {
	if (element.nodeType===3) return element.nodeValue;
	if (element.nodeType!==1) return null;
	let children=[], props={};
	for (let att of element.attributes) { 
		props[att.name] = att.value;
	}
	for (let child of element.childNodes) { 
		children.push(this.toVdom(child));
	}
	return h(nodeName || element.nodeName.toLowerCase(), props, children);
}


function wrapPreactComponent(Component, tagName) {
	return class extends HTMLElement {
		constructor() {
			super();
			this.shadowRoot = this.attachShadow({mode: 'open'});
			this._vdomComponent = Component;
		}
	
		connectedCallback()  {
			this.renderElement();
		}
	
		attributeChangedCallback(attrName, oldVal, newVal)  {
			this.renderElement();
		}
	
		disconnectedCallback() {
			this.unRenderElement();
		}
	
	
		renderElement() {
			render(toVdom(this, this._vdomComponent), this.shadowRoot, this._root);			
		}
	
		unrenderElement() {
			render(h(Empty), this.shadowRoot, this._root);
		}
	}
}

export default function register(Component, tagName) {
	return window.customElements.define(
		tagName || Component.displayName || Component.name,
		wrapPreactComponent(Component, tagName)
	);
}
