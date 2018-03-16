# preact-custom-element

Generate/register a custom element from a preact component. As of 3.0.0, this library implements the Custom Elements v1 spec.
Previous versions (< 3.0.0) implemented the v0 proposal, which was only implemented in Chrome and is abandoned.

## Usage

Import `CustomElement` and call with your component a tag name __\*__, and a list of attribute names you want to observe:

```javascript
import registerCustomElement from "preact-custom-element";

const Greeting = ({ name = "World" }) => (
	<p>Hello, {name}!</p>
);

registerCustomElement(Greeting, "x-greeting", ["name"]);
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

### Why the prop names parameter?

The Custom Elements V1 spec requires you to explictly state the attribute names you want to observe. From your Preact component perspective, `props` could be an object with any keys at runtime. This unfortunate combination of factors leaves us needing to explicitly state them.

It's possible that a compile step could introspect your usages of props and generate the glue code here. Please send me a link if you do this!

## Related

[preact-shadow-dom](https://github.com/bspaulding/preact-shadow-dom)
