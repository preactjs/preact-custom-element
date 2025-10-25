import { assert } from '@open-wc/testing';
import { h } from 'preact';
import registerElement from '../../src/index';

describe('options bag', () => {
	/** @type {HTMLDivElement} */
	let root;

	beforeEach(() => {
		root = document.createElement('div');
		document.body.appendChild(root);
	});

	afterEach(() => {
		document.body.removeChild(root);
	});

	it('supports `shadow`', () => {
		function ShadowDom() {
			return <div class="shadow-child">Shadow DOM</div>;
		}

		registerElement(ShadowDom, 'x-shadowdom', [], { shadow: true });
		const el = document.createElement('x-shadowdom');
		root.appendChild(el);

		const shadowRoot = el.shadowRoot;
		assert.isTrue(!!shadowRoot);
	});

	it('supports `mode: "open"`', () => {
		function ShadowDomOpen() {
			return <div class="shadow-child">Shadow DOM Open</div>;
		}

		registerElement(ShadowDomOpen, 'x-shadowdom-open', [], {
			shadow: true,
			mode: 'open',
		});

		const el = document.createElement('x-shadowdom-open');
		root.appendChild(el);

		const shadowRoot = el.shadowRoot;
		assert.isTrue(!!shadowRoot);

		const child = shadowRoot.querySelector('.shadow-child');
		assert.isTrue(!!child);
		assert.equal(child.textContent, 'Shadow DOM Open');
	});

	it('supports `mode: "closed"`', () => {
		function ShadowDomClosed() {
			return <div class="shadow-child">Shadow DOM Closed</div>;
		}

		registerElement(ShadowDomClosed, 'x-shadowdom-closed', [], {
			shadow: true,
			mode: 'closed',
		});

		const el = document.createElement('x-shadowdom-closed');
		root.appendChild(el);

		assert.isTrue(el.shadowRoot === null);
	});

	it('supports `adoptedStyleSheets`', () => {
		function AdoptedStyleSheets() {
			return <div class="styled-child">Adopted Style Sheets</div>;
		}

		const sheet = new CSSStyleSheet();
		sheet.replaceSync('.styled-child { color: red; }');

		registerElement(AdoptedStyleSheets, 'x-adopted-style-sheets', [], {
			shadow: true,
			adoptedStyleSheets: [sheet],
		});

		root.innerHTML = `<x-adopted-style-sheets></x-adopted-style-sheets>`;

		const child = document
			.querySelector('x-adopted-style-sheets')
			.shadowRoot.querySelector('.styled-child');

		const style = getComputedStyle(child);
		assert.equal(style.color, 'rgb(255, 0, 0)');
	});

	it('supports `serializable`', async () => {
		function SerializableComponent() {
			return <div>Serializable Shadow DOM</div>;
		}

		function NonSerializableComponent() {
			return <div>Non-serializable Shadow DOM</div>;
		}

		registerElement(SerializableComponent, 'x-serializable', [], {
			shadow: true,
			serializable: true,
		});

		registerElement(NonSerializableComponent, 'x-non-serializable', [], {
			shadow: true,
		});

		root.innerHTML = `
			<x-serializable></x-serializable>
			<x-non-serializable></x-non-serializable>
		`;

		const serializableEl = document.querySelector('x-serializable');
		const nonSerializableEl = document.querySelector('x-non-serializable');

		assert.isTrue(serializableEl.shadowRoot.serializable);
		assert.isFalse(nonSerializableEl.shadowRoot.serializable);

		const serializableHtml = serializableEl.getHTML({
			serializableShadowRoots: true,
		});
		const nonSerializableHtml = nonSerializableEl.getHTML({
			serializableShadowRoots: true,
		});

		assert.equal(
			serializableHtml,
			'<template shadowrootmode="open" shadowrootserializable=""><div>Serializable Shadow DOM</div></template>'
		);
		assert.isEmpty(nonSerializableHtml);
	});
});
