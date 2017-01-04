# preact-custom-element

Generate/register a custom element from a preact component.

## Usage

Import `CustomElement` and call with your component and a tag name __\*__:

```javascript
import registerCustomElement from "preact-custom-element";

const Greeting = ({ name = "World" }) => (
	<p>Hello, {name}!</p>
);

registerCustomElement(Greeting, "x-greeting");
```

> _**\* Note:** as per the [Custom Elements specification](http://w3c.github.io/webcomponents/spec/custom/#prod-potentialcustomelementname), the tag name must contain a hyphen._

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
