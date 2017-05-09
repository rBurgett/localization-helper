import 'object.values';
import 'object.entries';
import React from 'react';
import ReactDOM from 'react-dom';

import App from './app.jsx';

// Program flow:
// package.json has "main" set to app/index.html, so that's where we start.
// index.html executes all scripts we need.  Most are libraries we can use, so it just loads them to make them accessible.
//   index.html also creates a <div/> with an id of 'root'.
//   finally, index.html executes index.js.
// index.js is created by React, based on this file:  index.jsx.  It does that b/c webpack.config.js says to (see 'entry' and 'output').
//
// So, as far as our coding goes, we can think of this as our starting point.
//  First, we initialize nativeAPI.
//  Then, we render our React componente 'App' (see app.jsx) into the element with the 'root' id (see above - it's in index.html).
// That's it - everything happens in the App component and its sub-components.
nativeAPI.initialize()
    .then(() => {

        ReactDOM.render(
            <App />,
            document.getElementById('root')
        );

    })
    .catch(err => {
        nativeAPI.handleError(err);
    });
