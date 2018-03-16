import { h, render } from 'preact';

const Empty = () => null;

var _createClass = (function() {
	function defineProperties(target, props) {
		for (var i = 0; i < props.length; i++) {
			var descriptor = props[i];
			descriptor.enumerable = descriptor.enumerable || false;
			descriptor.configurable = true;
			if ('value' in descriptor) descriptor.writable = true;
			Object.defineProperty(target, descriptor.key, descriptor);
		}
	}
	return function(Constructor, protoProps, staticProps) {
		if (protoProps) defineProperties(Constructor.prototype, protoProps);
		if (staticProps) defineProperties(Constructor, staticProps);
		return Constructor;
	};
})();
function _classCallCheck(instance, Constructor) {
	if (!(instance instanceof Constructor)) {
		throw new TypeError('Cannot call a class as a function');
	}
}
function _possibleConstructorReturn(self, call) {
	if (!self) {
		throw new ReferenceError(
			"this hasn't been initialised - super() hasn't been called"
		);
	}
	return call && (typeof call === 'object' || typeof call === 'function')
		? call
		: self;
}
function _inherits(subClass, superClass) {
	if (typeof superClass !== 'function' && superClass !== null) {
		throw new TypeError(
			'Super expression must either be null or a function, not ' +
				typeof superClass
		);
	}
	subClass.prototype = Object.create(superClass && superClass.prototype, {
		constructor: {
			value: subClass,
			enumerable: false,
			writable: true,
			configurable: true
		}
	});
	if (superClass)
		Object.setPrototypeOf
			? Object.setPrototypeOf(subClass, superClass)
			: (subClass.__proto__ = superClass);
}

export default function register(Component, tagName, propNames) {
	let klass = (function(_HTMLElement) {
		_inherits(klass, _HTMLElement);

		function klass() {
			_classCallCheck(this, klass);

			var _this = Reflect.construct(HTMLElement, [], klass);

			_this._vdomComponent = Component;
			return _this;
		}

		_createClass(
			klass,
			[
				{
					key: 'connectedCallback',
					value: function connectedCallback() {
						renderElement.apply(this);
					}
				},
				{
					key: 'attributeChangedCallback',
					value: function attributeChangedCallback() {
						renderElement.apply(this);
					}
				},
				{
					key: 'detachedCallback',
					value: function detachedCallback() {
						unRenderElement.apply(this);
					}
				}
			],
			[
				{
					key: 'observedAttributes',
					get: function() {
						return propNames;
					}
				}
			]
		);

		return klass;
	})(HTMLElement);
	return window.customElements.define(
		tagName || Component.displayName || Component.name,
		klass
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
