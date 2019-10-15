# preact-custom-element

[![CircleCI](https://circleci.com/gh/bspaulding/preact-custom-element/tree/master.svg?style=shield)](https://circleci.com/gh/bspaulding/preact-custom-element/tree/master)
[![BrowserStack Status](https://www.browserstack.com/automate/badge.svg?badge_key=VHpBSXVTajJPOWl5OURJRlY5VE9yaW9hbmh1ZFBXd1BTY1pId3pHQk02MD0tLUNqd0pMaVVvU3ppWnZuSFA3OExvOHc9PQ==--81bc10ad2712a85711a0999c04adeca09cf61b7b%)](https://www.browserstack.com/automate/public-build/VHpBSXVTajJPOWl5OURJRlY5VE9yaW9hbmh1ZFBXd1BTY1pId3pHQk02MD0tLUNqd0pMaVVvU3ppWnZuSFA3OExvOHc9PQ==--81bc10ad2712a85711a0999c04adeca09cf61b7b%) [![Greenkeeper badge](https://badges.greenkeeper.io/preactjs/preact-custom-element.svg)](https://greenkeeper.io/)

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

## Thanks

Big thanks to BrowserStack for providing service for CI on this project! BrowserStack allows us to test this project on all real browsers that support Custom Elements, including mobile browsers.

<a href="https://www.browserstack.com" target="_blank" rel="noopener noreferrer"><img src="https://p14.zdusercontent.com/attachment/1015988/9muQl92dJ9ShKIGmIt7iaICUb?token=eyJhbGciOiJkaXIiLCJlbmMiOiJBMTI4Q0JDLUhTMjU2In0..W4aqOGR0iTl_Rh1nskJGRQ.gLdLdkMD8vfZdJ7eqZpU6lmB-yGQv2hCYRJeBQ91WtaJzpYMQQUEWNE0oK3xLjBKYPKWA9D1UlA-beeUwlczRKVF8ZoG8OMDg6K3vVIIFKH3an8QfcH0iFQXhH4m6cmXqoPAcqDXvrpv3DUXIQaxD8bXykKFpBR5gEk6m3VsH8geK4UxzQ3ORYCOv4XD8EPm-Ap0lZwVZaGMHAncCP9dlOVhZjVVDKwBI5cwFOa_jSwtsCbgW3EX901k-nu1w6IlgFvWh8mxMaM4DMtVtCGfnuNspN7qYXJRTgMEVPVIk8o.bKvlbSGn8PntRSHO7sgBSA" height="150"/>
</a>
