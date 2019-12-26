# preact-custom-element

Generate/register a custom element from a preact component. As of 3.0.0, this library implements the Custom Elements v1 spec.
Previous versions (< 3.0.0) implemented the v0 proposal, which was only implemented in Chrome and is abandoned.

## Usage

Import `CustomElement` and call with your component a tag name __\*__, and a list of attribute names you want to observe:

```javascript
import register from 'preact-custom-element';

const Greeting = ({ name = 'World' }) => (
  <p>Hello, {name}!</p>
);

register(Greeting, 'x-greeting', ['name']);
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

### Prop Names and Automatic Prop Names

The Custom Elements V1 specification requires explictly stating the names of any attributes you want to observe. From your Preact component perspective, `props` could be an object with any keys at runtime, so it's not always clear which props should be accepted as attributes.

If you omit the third parameter to `register()`, the list of attributes to observe can be specified using a static `observedAttributes` property on your Component. This also works for the Custom Element's name, which can be specified using a `tagName` static property:

```js
import register from 'preact-custom-element';

// <x-greeting name="Bo"></x-greeting>
class Greeting extends Component {
  // Register as <x-greeting>:
  static tagName = 'x-greeting';

  // Track these attributes:
  static observedAttributes = ['name'];

  render({ name }) {
    return <p>Hello, {name}!</p>;
  }
}
register(Greeting);
```

If no `observedAttributes` are specified, they will be inferred from the keys of `propTypes` if present on the Component:

```js
// Other option: use PropTypes:
function FullName(props) {
  return <span>{props.first} {props.last}</span>
}
FullName.propTypes = {
  first: Object,   // you can use PropTypes, or this
  last: Object     // trick to define untyped props.
};
register(FullName, 'full-name');
```


## Related

[preact-shadow-dom](https://github.com/bspaulding/preact-shadow-dom)
