# preact-custom-element

Generate/register a custom element from a preact component.

## Usage

Import `CustomElement` and call with your component and a tag name:

```javascript
import registerCustomElement from "preact-custom-element";

const Greeting = ({ name = "World" }) => (
	<p>Hello, {name}!</p>
);

registerCustomElement(Greeting, "x-greeting");
```

Use the new tag name in HTML, attribute keys and values will be passed in as props:

```html
<x-greeting name="Billy Jo"></x-greeting>
```

Output:

```html
<p>Hello, Billy Jo!</p>
```

## Related

[preact-shadow-dom](https://github.com/bspaulding/preact-shadow-dom)
