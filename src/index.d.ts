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

export default function register(
	Component: AnyComponent,
	tagName?: string,
	propNames?: string[],
	options?: Options
): void;
