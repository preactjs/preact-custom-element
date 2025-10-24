# preact-custom-element

Generate/register a custom element from a preact component. As of 3.0.0, this library implements the Custom Elements v1 spec.
Previous versions (< 3.0.0) implemented the v0 proposal, which was only implemented in Chrome and is abandoned.

## Usage

Any Preact component can be registered as a custom element simply by importing `register` and calling it with your component, a tag name<strong>*</strong>, and a list of attribute names you want to observe:

```javascript
import register from 'preact-custom-element';

const Greeting = ({ name = 'World' }) => (
  <p>Hello, {name}!</p>
);

register(Greeting, 'x-greeting', ['name'], { shadow: true, mode: 'open', adoptedStyleSheets: [], serializable: true });
//          ^            ^           ^             ^               ^            ^                    ^
//          |      HTML tag name     |       use shadow-dom        |    use adoptedStyleSheets     |
//   Component definition      Observed attributes     Encapsulation mode for the shadow DOM tree   Enable declarative shadow DOM
```

> _**\* Note:** as per the [Custom Elements specification](https://html.spec.whatwg.org/multipage/custom-elements.html#valid-custom-element-name), the tag name must contain a hyphen._

Use the new tag name in HTML, attribute keys and values will be passed in as props:

```html
<x-greeting name="Billy Jo"></x-greeting>
```

Output:

```html
<p>Hello, Billy Jo!</p>
```

### Observed Attributes

The Custom Elements v1 specification requires explicitly listing the names of attributes you want to observe in order to respond when their values are changed. These can be specified via the third parameter that's passed to the `register()` function:

```js
// Listen to changes to the `name` attribute
register(Greeting, 'x-greeting', ['name']);
```

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
function FullName({ first, last }) {
  return <span>{first} {last}</span>
}

FullName.propTypes = {
  first: Object,   // you can use PropTypes, or this
  last: Object     // trick to define untyped props.
};

register(FullName, 'full-name');
```

### Passing slots as props

The `register()` function also accepts an optional fourth parameter, an options bag. At present, it allows you to opt-in to using shadow DOM for your custom element by setting the `shadow` property to `true`, and if so, you can also specify the encapsulation mode with `mode`, which can be either `'open'` or `'closed'`. Additionally, you can enable declarative shadow DOM by setting `serializable` to `true`, which is useful for server-side rendering scenarios.

When using shadow DOM, you can make use of named `<slot>` elements in your component to forward the custom element's children into specific places in the shadow tree.

```jsx
function TextSection({ heading, content }) {
    return (
        <div>
            <h2>{heading}</h2>
            <p>{content}</p>
        </div>
    );
}

register(TextSelection, 'text-selection', [], { shadow: true });
```

```html
<text-section>
    <span slot="heading">My Heading</span>
    <span slot="content">Some content goes here.</span>
</text-section>

### Declarative Shadow DOM (serializable option)

The `serializable` option enables declarative shadow DOM for server-side rendering:

```js
register(MyComponent, 'my-element', [], { 
    shadow: true, 
    serializable: true 
});

// Usage with getHTML() for SSR
const el = document.querySelector('my-element');
const html = el.getHTML({ serializableShadowRoots: true });

// Test serializable shadow root
console.log(el.shadowRoot.serializable); // true
```
```

### Static Properties

We support a number of static properties on your component that map to special behaviors of the custom element. These can be set on components like so:

```js
class MyCustomElement extends Component {
  static tagName = 'my-custom-element';
}

function MyOtherCustomElement() { ... }
MyOtherCustomElement.tagName = 'my-other-custom-element';
```

- `tagName`
  - the custom element's tag name (if not passed as the second argument to `register()`)
- `observedAttributes`
  - an array of attribute names to observe (if not passed as the third argument to `register()`)
- `formAssociated`
  - a boolean indicating whether the custom element should be form-associated

## Related

[preact-shadow-dom](https://github.com/bspaulding/preact-shadow-dom)
