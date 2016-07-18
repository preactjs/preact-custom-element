import { h, render, unmountComponentAtNode } from "preact";

export default function CustomElement(ComponentClass, tagName) {
	var elementPrototype = Object.create(HTMLElement.prototype);
	function renderElement() {
		const props = [].slice.call(this.attributes).reduce((attrs, attr) => {
			attrs[attr.nodeName] = attr.nodeValue;
			return attrs;
		}, {});
		render(<ComponentClass {...props}/>, this);
	};
	elementPrototype.attachedCallback = renderElement;
	elementPrototype.detachedCallback = function() {
		unmountComponentAtNode(this);
	};
	elementPrototype.attributeChangedCallback = renderElement;

	return document.registerElement(tagName || ComponentClass.displayName, {
		prototype: elementPrototype
	});
}


