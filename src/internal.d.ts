import { h, AnyComponent } from 'preact';

export type PreactCustomElement = HTMLElement & {
	_options?: unknown;
	_root: ShadowRoot | HTMLElement;
	_vdomComponent: AnyComponent;
	_vdom: ReturnType<typeof h> | null;
	_props?: Record<string, unknown>;
	_pendingProps?: Record<string, unknown> | null;
	_renderQueued?: boolean;
	_mounted?: boolean;
};
