import { assert } from '@open-wc/testing';
import { h, Component } from 'preact';
import registerElement from '../../src/index';

describe('static properties', () => {
	/** @type {HTMLDivElement} */
	let root;

	beforeEach(() => {
		root = document.createElement('div');
		document.body.appendChild(root);
	});

	afterEach(() => {
		document.body.removeChild(root);
	});

	it('supports `tagName`', () => {
		class TagNameClass extends Component {
			static tagName = 'x-tag-name-class';

			render() {
				return <input name="foo" />;
			}
		}
		registerElement(TagNameClass);

		function TagNameFunction() {
			return <input name="bar" />;
		}
		TagNameFunction.tagName = 'x-tag-name-function';
		registerElement(TagNameFunction);

		root.innerHTML = `
			<div>
				<x-tag-name-class></x-tag-name-class>
				<x-tag-name-function></x-tag-name-function>
			</div>
		`;

		assert.isTrue(!!document.querySelector('x-tag-name-class'));
		assert.isTrue(!!document.querySelector('x-tag-name-function'));
	});

	it('supports `observedAttributes`', () => {
		class ObservedAttributesClass extends Component {
			static observedAttributes = ['name'];

			render({ name }) {
				return <input name={name} />;
			}
		}
		registerElement(ObservedAttributesClass, 'x-observed-attributes-class');

		function ObservedAttributesFunction({ name }) {
			return <input name={name} />;
		}
		ObservedAttributesFunction.observedAttributes = ['name'];
		registerElement(
			ObservedAttributesFunction,
			'x-observed-attributes-function'
		);

		const observedAttributesClassEl = document.createElement(
			'x-observed-attributes-class'
		);
		const observedAttributesFunctionEl = document.createElement(
			'x-observed-attributes-function'
		);

		observedAttributesClassEl.setAttribute('name', 'class-name');
		observedAttributesFunctionEl.setAttribute('name', 'function-name');

		root.appendChild(observedAttributesClassEl);
		root.appendChild(observedAttributesFunctionEl);

		assert.equal(
			root.innerHTML,
			`<x-observed-attributes-class name="class-name"><input name="class-name"></x-observed-attributes-class><x-observed-attributes-function name="function-name"><input name="function-name"></x-observed-attributes-function>`
		);

		observedAttributesClassEl.setAttribute('name', 'new-class-name');
		observedAttributesFunctionEl.setAttribute('name', 'new-function-name');

		assert.equal(
			root.innerHTML,
			`<x-observed-attributes-class name="new-class-name"><input name="new-class-name"></x-observed-attributes-class><x-observed-attributes-function name="new-function-name"><input name="new-function-name"></x-observed-attributes-function>`
		);
	});

	it('supports `internals`', () => {
		const captured = [];
		const orig = HTMLElement.prototype.attachInternals;
		HTMLElement.prototype.attachInternals = function () {
			const i = orig.call(this);
			captured.push(i);
			return i;
		};

		try {
			class InternalsClass extends Component {
				static internals = { role: 'group', ariaLabel: 'class label' };

				render() {
					return <div>internals-class</div>;
				}
			}
			registerElement(InternalsClass, 'x-internals-class', []);

			function InternalsFunction() {
				return <div>internals-function</div>;
			}
			InternalsFunction.internals = {
				role: 'list',
				ariaLabel: 'function label',
			};
			registerElement(InternalsFunction, 'x-internals-function', []);

			const classEl = document.createElement('x-internals-class');
			const fnEl = document.createElement('x-internals-function');
			root.appendChild(classEl);
			root.appendChild(fnEl);

			assert.equal(captured.length, 2);
			assert.equal(captured[0].role, 'group');
			assert.equal(captured[0].ariaLabel, 'class label');
			assert.equal(captured[1].role, 'list');
			assert.equal(captured[1].ariaLabel, 'function label');
		} finally {
			HTMLElement.prototype.attachInternals = orig;
		}
	});

	it('supports `formAssociated`', () => {
		class FormAssociatedClass extends Component {
			static formAssociated = true;

			render() {
				return <input name="foo" />;
			}
		}
		registerElement(FormAssociatedClass, 'x-form-associated-class', []);

		function FormAssociatedFunction() {
			return <input name="bar" />;
		}
		FormAssociatedFunction.formAssociated = true;
		registerElement(FormAssociatedFunction, 'x-form-associated-function', []);

		root.innerHTML = `
			<form id="myForm">
				<x-form-associated-class></x-form-associated-class>
				<x-form-associated-function></x-form-associated-function>
			</form>
		`;

		const myForm = /** @type {HTMLFormElement} */ (
			document.getElementById('myForm')
		);

		// The `.elements` property of a form includes all form-associated elements
		assert.equal(myForm.elements[0].tagName, 'X-FORM-ASSOCIATED-CLASS');
		assert.equal(myForm.elements[2].tagName, 'X-FORM-ASSOCIATED-FUNCTION');
	});
});
