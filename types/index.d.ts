import type {
	FunctionComponent,
	FunctionalComponent,
	ComponentClass,
} from 'preact';

export type RegisterOptions =
	| {
			/**
			 * Default: do not use shadow-dom for rendering
			 */
			shadow: false;
	  }
	| {
			/**
			 * Use shadow-dom for rendering
			 */
			shadow: true;
			/**
			 * A string specifying the encapsulation mode for the shadow DOM tree.
			 * Default mode is `"open"`
			 * @see https://developer.mozilla.org/en-US/docs/Web/API/Element/attachShadow#mode
			 */
			mode?: 'open' | 'closed';
	  };

/**
 * Register a preact component as web-component.
 * @param componentDefinition The preact component to register
 * @param tagName The HTML element tag-name (must contain a hyphen and be lowercase)
 * @param observedAttributes HTML element attributes to observe
 * @param options Additional element options
 * @example
 * ```ts
 * // use custom web-component class
 * class PreactWebComponent extends Component {
 *   static tagName = 'my-web-component';
 *   render() {
 *     return <p>Hello world!</p>
 *   }
 * }
 *
 * register(PreactComponent);
 *
 * // use a preact component
 * function PreactComponent({ prop }) {
 *   return <p>Hello {prop}!</p>
 * }
 *
 * register(PreactComponent, 'my-component');
 * register(PreactComponent, 'my-component', ['prop']);
 * register(PreactComponent, 'my-component', ['prop'], {
 *   shadow: true,
 *   mode: 'closed'
 * });
 * ```
 */
declare function register(
	componentDefinition:
		| FunctionComponent<any>
		| ComponentClass<any>
		| FunctionalComponent<any>,
	tagName?: string,
	observedAttributes?: string[],
	options?: RegisterOptions
): void;

export default register;
