import { h, AnyComponent } from 'preact';

type PreactCustomElement = HTMLElement & {
	_root: ShadowRoot | HTMLElement;
	_vdomComponent: AnyComponent;
	_vdom: ReturnType<typeof h> | null;
	_props: Record<string, unknown>;
};

type Options =
	| {
			shadow: false;
	  }
	| {
			shadow: true;
			mode?: 'open' | 'closed';
			adoptedStyleSheets?: CSSStyleSheet[];
	  };

/**
 * Register a preact component as web-component.
 *
 * @example
 * ```jsx
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
 * const klass = register(PreactComponent, 'my-component');
 * ```
 */
export default function register<P = {}, S = {}>(
	Component: AnyComponent<P, S>,
	tagName?: string,
	propNames?: (keyof P)[],
	options?: Options
): HTMLElement;
