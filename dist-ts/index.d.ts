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
			serializable?: boolean;
	  };
/**
 * Register a preact component as web-component.
 */
export default function register<P = {}, S = {}>(
	Component: AnyComponent<P, S>,
	tagName?: string,
	propNames?: (keyof P)[],
	options?: Options
): typeof HTMLElement & {
	new (): PreactCustomElement;
};
export {};
//# sourceMappingURL=index.d.ts.map
