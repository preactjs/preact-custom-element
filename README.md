# preact-custom-element

Generate/register a custom element from a preact component.

## Usage

```javascript
import CustomElement from "preact-custom-element";

const Greeting = ({ name = "World" }) => (
	<p>Hello, {name}!</p>
);

CustomElement(Greeting, "x-greeting");
```

```html
	<x-greeting name="Billy Jo"></x-greeting>
```

Output:

```html
	<p>Hello, Billy Jo!</p>
```

## Related

[preact-shadow-dom](https://github.com/bspaulding/preact-shadow-dom)
