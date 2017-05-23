import React from 'react';
import * as _ from 'lodash';

import Header from './header.jsx';
import Sidebar from './Sidebar.jsx';
import Keylist from './Keylist.jsx';

// changed from const to let, and bind nativeAPI.  This allows deserializeFile to call readFile.
let {handleError, deserializeFile, serialize, createNewDataObject, writeFile} = nativeAPI;
deserializeFile = deserializeFile.bind(nativeAPI);

// - shift-enter as keyboard shortcut to add new key. use a package?  how decide what package?  e.g., https://www.npmjs.com/package/react-shortcuts and https://www.npmjs.com/package/react-hotkey
//     - NO, in this case don't use a package.  Use onKeyDown in <input>.  Look up in React synthetic events, and MDN keydown
//     - for finding packages in general, though:
//         - assuming it looks like it will solve the problem:
//         - check date is recent, recent # of downloads, current git issues, stars on git.  If no git repo, be wary.  But can search for it separately on GitHub - may just not be linked to the npm page.
// - to understand the classes we use, review http://bootstrapdocs.com/v3.3.6/docs/
// - to review handling events, see:  https://facebook.github.io/react/docs/events.html

// We usually create functions to return React components.  Because React will create a constructor internally,
//  we capitalize those function names (e.g., Sidebar).
// But for App, we actually create a class by extending React.Component, rather than simply creating a function.
//  We extend React.Component like this when:
//  - we need to maintain state in the component
//  - or, we need to use life-cycle methods of the component, such as willMount, etc.
//  Otherwise, we use the function syntax because it's more concise and clean and is stateless: just takes input, and returns UI.  Both syntaxes actually create identical React components.
class App extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            windowHeight: window.innerHeight,
            loadedFile: '',
            locale: '',
            context: '',
            filter: '',
            activeId: '',
            data: {}
        };

        // comment out:  only needed for testing
        // this.firstRun = true;

        _.bindAll(this, ['filePathChanged', 'addNewContext', 'addNewKeyValue', 'contextChanged', 'keyValueChanged',
            'saveFile', 'deleteContext', 'deleteKeyValue', 'filterChanged']);
    }

    componentWillMount() {
        window.addEventListener('resize', e => {
            const {innerHeight} = e.target;

            this.setState({
                ...this.state,
                windowHeight: innerHeight
            });
        });

        nativeAPI.registerMainComponent(this);
    }

    filterChanged(newFilter) {
        // We don't have to rebuild the whole state.  this.setState will merge our changes into the current state.
        //  So, we only need to include what changed.
        this.setState({
            activeId: '',
            filter: newFilter
        });
    }

    // Can/should we use property initializer syntax instead of binding?  https://facebook.github.io/react/blog/2015/01/27/react-v0.13.0-beta-1.html#autobinding
    //  - that syntax may not be available yet.  In any case, Ryans says it is just a matter of personal style.
    filePathChanged(newPath) {
        const deserializedData = deserializeFile(newPath);

        this.setState({
            ...this.state,
            loadedFile: newPath,
            locale: deserializedData.locale,
            data: deserializedData.data
        });

        // test - why is this.state empty if we do a simple 'console.log(this.state);' here?
        //  - this.setState is sort of asynchronous because it hits the DOM.
        //      Stuff that hits the DOM will complete in order, but our program continues before the DOM stuff finishes.  So, use setTimeout as below.
        //      or, create a const newState = whatever changes to state I want, then call this.setState(newState).
        setTimeout(() => {
            // console.log('t0', this.state);
            // console.log('t1', this.state.locale, this.state.data);
            // console.log(serialize(this.state.data, this.state.locale));
        }, 0);
    }

    // what is the syntax to write this as a simple arrow function:
    //   createKeyValueObject = (key, value) => {[key]: value};
    // solution:  put the object we are returning in ()
    // createKeyValueObject = (key, value) => ({[key]: value});
    // createKeyValueObject(key, value) {
    //     return {[key]: value};
    // }

    addNewContext(newContext) {
        // we should always check before getting here, but to be safe, check so we don't wipe out existing data.
        if (this.state.data[newContext]) {
            return;
        }

        const newObj = createNewDataObject(newContext, '', '');
        this.setState({
            ...this.state,
            filter: '',     // clear the filter so the blank item is displayed
            context: newContext,
            activeId: newObj.id,
            data: [
                ...this.state.data,
                newObj
            ]
        });
    }

    deleteContext(context) {
        // const temp = {...this.state.data};
        // delete(temp[context]);

        this.setState({
            ...this.state,
            context: '',
            activeId: '',
            data: this.state.data.filter(e => e.context !== context)
            /* {
             // If we want a functional way to delete from an object, such as:
             //...{...this.state.data}.delete(context)
             //  - can use lodash omit: https://lodash.com/docs#omit but not sure:  might mutate the original, as well as return an object.
             //  - Ryan helped me write my own function to do it and in native-api add it to window, and update .eslintrc.json.
             ...temp
             }*/
        });
    }

    addNewKeyValue(context, newKey, newValue) {

        const newObj = createNewDataObject(context, newKey, newValue);
        this.setState({
            ...this.state,
            filter: '',     // clear the filter so we will display the blank item we create
            activeId: newObj.id,
            data: [
                newObj,
                ...this.state.data
            ]
        });
    }

    deleteKeyValue(id) {
        this.setState({
            ...this.state,
            activeId: this.state.activeId == id ? '' : this.state.activeId, // if we are deleting the item with focus, set no item to be active.
            data: this.state.data.filter(e => e.id !== id)
        });
    }

    contextChanged(newSelectedContext) {
        // I don't clear the filter here because user may be looking for something and doesn't know what context it is in,
        //  so they want the filter applied when they change contexts.
        this.setState({
            ...this.state,
            activeId: '',   // changed contexts, so the old activeId can't be visible anymore.
            context: newSelectedContext
        });
    }

    // Webstorm says this method can be static:  is this something we can/should do? - NO.
    //  We can turn off these warnings by clicking the robot in the bottom right corner, and click Configure Inspections.
    //  Ryan turns off spelling and everything in Javascript except ESLint in Code Quality Tools.
    createKeyFromValue(value) {
        // remove all non alphanumeric characters, and uppercase the following character

        let key = '';
        let skippedChar = true; // default to true so we capitalize the first character

        for (const c of value) {
            if (/[^a-zA-Z0-9]/.test(c)) {
                // this is a non-alphanumeric character
                skippedChar = true;
                continue;
            }

            key += skippedChar ? c.toUpperCase() : c;
            skippedChar = false;
        }

        return key;
    }

    // better syntax for getting key of object?  For example:
    // const asdf = { myInterestingName: 'my value' };
    // Object.keys(asdf)[0]; is very clunky.
    // asdf.keys[0]; would be ok.
    // Answer:  see https://facebook.github.io/immutable-js/ this is a solid package many people use.  can use Map, Set, but use immutable ones.
    //  But, for this app, makes more sense to use objects like:
    //  const asdf = { key: 'mykey', value: 'my value'};
    //  so there is no need to get the name of the key.  It is always, 'key'.

    keyValueChanged(id, newKey, newValue, newNotes) {

        // update the key/value pair in our state.
        const oldKeyValue = this.state.data.find(kv => kv.id === id);

        // check whether old value is the same as the new value.  If not, update the key to match the new value.
        const newKeyForValue = oldKeyValue.value === newValue ? newKey : this.createKeyFromValue(newValue);
        // we use 'locale' as a key in the final file, so we can't have it as a key for a text.  Use locale1 instead.
        const newKeyToUse = newKeyForValue === 'locale' ? 'locale1' : newKeyForValue;

        this.setState({
            ...this.state,
            activeId: id,
            data: this.state.data.map(kv => kv.id === id ?
                {
                    id: id,
                    context: oldKeyValue.context,
                    key: newKeyToUse,
                    value: newValue,
                    notes: newNotes
                } : kv)
        });
    }

    saveFile(newFile) {
        const dataToSave = serialize(this.state.data, this.state.locale);

        if (newFile) {
            // This is a Save As.  The user specified a file to save.
            writeFile(newFile, dataToSave);
            this.setState({
                ...this.state,
                loadedFile: newFile
            });
        } else {
            // The user did not specify a file, so overwrite the file we loaded.
            writeFile(this.state.loadedFile, dataToSave);
        }
    }

    _escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
    }

    _getDataForContext() {
        if (this.state.data.length > 0) {
            // Use a regex so we can make the filter case-insensitive.  Be sure to escape the filter so the user
            //  can search for special characters like \, ?, or .
            const regex = new RegExp(this._escapeRegExp(this.state.filter), 'i');
            return this.state.data
                .filter(e => e.context === this.state.context)
                .filter(e => (e.id === this.state.activeId || regex.test(e.value)));    // don't let the item being edited get filtered out
        }

        return [];
    }

    _getContexts() {
        if (this.state.data.length > 0) {
            return this.state.data.map(e => e.context)
                .filter((e, i, a) => a.indexOf(e) === i);
        }

        return [];
    }

    render() {

        // comment these if's out.  They are just for testing.
        // if (!this.state.loadedFile) {
        //     this.filePathChanged('/Users/david/dev/git/temp/teachers_guide_en-US3c.json');
        // }

        // if (this.firstRun) {
        //     this.firstRun = false;
        //     this.contextChanged('Menubar');
        // }

        const styles = {
            row: {
                paddingTop: 50
            },
            col1: {
                paddingTop: 15
            },

            col2: {
                paddingTop: 15
            }
        };

        return (
            <div>
                <Header loadedFile={this.state.loadedFile} />
                <div className="container-fluid">
                    <div className="row" style={styles.row}>
                        <div className="col-sm-2" style={styles.col1}>
                            <Sidebar allContexts={this._getContexts()} selectedContext={this.state.context}
                                     myFile={this.state.loadedFile}
                                     windowHeight={this.state.windowHeight} filePathChanged={this.filePathChanged}
                                     contextChanged={this.contextChanged} saveFile={this.saveFile}
                                     addNewContext={this.addNewContext} />
                        </div>
                        <div className="col-sm-10" style={styles.col2}>
                            <Keylist dataForContext={this._getDataForContext()}
                                     selectedContext={this.state.context} filter={this.state.filter}
                                     windowHeight={this.state.windowHeight}
                                     keyValueChanged={this.keyValueChanged}
                                     addNewKeyValue={this.addNewKeyValue} deleteContext={this.deleteContext}
                                     deleteKeyValue={this.deleteKeyValue} filterChanged={this.filterChanged} />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

}

//  the 'default' keyword:  so that import can just import a single variable rather than having to use object destructuring, etc.
//  see MDN:  https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import
export default App;
