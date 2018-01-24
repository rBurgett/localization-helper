/* eslint no-alert: 0 */

// Why can't do 'import' syntax here, but we can in jsx files?
//  - wasn't worth the overhead, since it would require a separate build process:  build-client and build-node
//      and the associated watch-client and watch-node like we do for Teachers Guide.
//  - just need to change the loaders/test regex in webpack.config.js? - no, just use babel directly instead of webpack.
//      - Ryan helped me make the changes to package.json (add scripts build-node and watch-node), and
//          update index.html where to find the babel'd version of native-api.js.
//      - if we want to edit webpack.config.js, how do we do it?  with npm somehow, like we do for package.json, or directly edit? or some UI to select files?
//          - directly edit.  Usually copy something that works from project to project, tweak if necessary.
//          - NOTE:  same applies to .babelrc - just tweak manually as needed.
//  - What is the interaction with babel/webpack, when I run or build?
//      - when a file is saved that is being watched by a babel watch script, the file is re-transpiled.
//      - webpack uses babel with the same .babelrc
const co = require('co');
const fs = require('co-fs-extra');
const path = require('path');
const {swal} = require('promise-alert');
const uuid = require('uuid');

window.deleteProp = (obj, key) => Object
    .keys(obj)
    .filter(k => k !== key)
    .reduce((newObj, k) => {
        return Object.assign(
            {},
            newObj,
            {[k]: obj[k]}
        );
    }, {});

// not needed since I
// const readFile = filePath => fs.readFileSync(path.normalize(filePath), 'utf8');

const createNewDataObjectInternal = (context, key, value, notes) =>
    ({
        id: uuid.v4(),
        context: context,
        key: key,
        value: value,
        notes: notes
    });

const deserialize = data => {
    // format the data from the file in a way that is most useful for our application
    // The input format is:
    //  {
    //     "locale": "en-US",                   // hard-coded "locale" and the locale string
    //     "ExportProject": {                   // key for a term to be translated
    //         "universal": {                   // context
    //             "val": "Export Project"      // value to use for this key, for this locale
    //             "notes: ''
    //         }
    //         "ProjectsTab-CreateProjectDialog": {     // a key (e.g., ExportProject) may have multiple contexts.  Hyphen indicates sub-context.
    //             "val": "Export Project"
    //         }
    //      }, etc.
    //  }
    //
    // internal format we convert to, for convenience within this application (the deserialize output format):
    // {
    //      id: uuid,                   //
    //      context: 'universal',
    //      key: 'ExportProject',
    //      value: 'Export Project',
    //      notes: ''
    // }
    //
    // old:
    //  {
    //      "universal": [                              // context
    //          {"ExportProject": "Export Project"},    // array of key-value pairs
    //          {"OpenFile": "Open File"}
    //       ],
    //      "ProjectsTab-CreateProjectDialog": [
    //          {"ExportProject": "Export Project"}
    //      ]
    //  }

    //  First, remove the locale.  The input data has the locale as the first item, but we don't need it in our internal data.
    const noLocale = Object.keys(data).filter(a => a !== 'locale');

    // Build our data structure:
    // new:
    const ourDS = noLocale.reduce((d, k) => {
        const contextsForKey = Object.keys(data[k]);    // get all the contexts that this key is used in

        // apparently array expansion works, but not object spread?
        //  - true.
        return contextsForKey.reduce((d2, context) => {
            const temp = [
                ...d2,
                createNewDataObjectInternal(context, k, data[k][context].val, data[k][context].notes)
            ];
            return temp;
        }, d);
    }, []);

    // old
    //  For each key in the original data, insert it and its value into each of its contexts in our internal data.
    //  Create each context if it doesn't already exist.
    // const ourDataStructure = noLocale.reduce((d, k) => {
    //     const contextsForKey = Object.keys(data[k]);    // get all the contexts that this key is used in
    //
    //     // helper function to include previous key-value pairs for a context
    //     const keyValuePairsForContext = (context1) => d[context1] ? d[context1] : '';
    //
    //     // add this key in all its contexts to our internal data structure
    //     return contextsForKey.reduce((d2, context) => {
    //         // get whatever keys we've already added to this context
    //         const keyValuePairsSoFar = keyValuePairsForContext(context);
    //
    //         // add this key in this context, in the data structure we want.
    //         return {
    //             ...d2,
    //             [context]: [...keyValuePairsSoFar,
    //                 {[k]: data[k][context].val}
    //             ].filter(String)    // I don't know how to not insert anything, so I use '' in keyValuePairsForContext and filter it out here.
    //         };
    //     }, d);  // pass in our data structure as it is so far, so we can add this key in all its contexts.
    //
    // }, {});     // initialize our internal data structure to an empty object.

    return {
        locale: data.locale,
        data: ourDS //ourDataStructure
    };
};

const serializeInternal = (data, locale) => {
    // put the data into our output format, so we can save the file.  This is the reverse of deserialize(data).
    //  see deserialize() for a description of the data.

    // new:
    const serializedData = data.reduce((d, obj) => {
        // helper function to include previous context objects for this key
        const contextsForKey = (key1) => d[key1] ? d[key1] : '';

        const innerObj = Object.assign({}, contextsForKey(obj.key),
            {
                [obj.context]: {
                    val: obj.value,
                    notes: obj.notes
                }
            });

        return Object.assign({}, d,
            {
                [obj.key]: innerObj
            });

        // can't use object spread b/c babel doesn't hit this file.
        // return {
        //     ...d,
        //     [obj.key]: {
        //         ...contextsForKey(obj.key),
        //         [obj.context]: {
        //             val: obj.value
        //         }
        //     }
        // };
    }, {});

    // old:
    // const contexts = Object.keys(data);
    //
    // const serializedDataOld = contexts.reduce((d, context) => {
    //
    //     // helper function to include previous context objects for this key
    //     const contextsForKey = (key1) => d[key1] ? d[key1] : '';
    //
    //     return data[context].reduce((d2, kv) => {
    //
    //         const key = Object.keys(kv)[0];
    //         const value = kv[key];
    //
    //         const contextsForKeySoFar = contextsForKey(key);
    //
    //         return {
    //             ...d2,
    //             [key]: {
    //                 ...contextsForKeySoFar,
    //                 [context]: {
    //                     val: value
    //                 }
    //             }
    //         };
    //     }, d);
    //
    // }, {});

    // can't use object spread b/c babel doesn't hit this file.
    // return {
    //     locale: locale,
    //     ...serializedData
    // };

    const formattedData = Object.assign({},
        {locale: locale},
        serializedData);

    return JSON.stringify(formattedData, null, '\t');
};

// window.nativeAPI is simply an object with some methods, right? - yes
//  and by calling it window.nativeAPI rather than just nativeAPI, that makes it global?
//  - all variables declared with 'var' are global unless they are in a module.  'const' and 'let' scope to the file they are in.
//  - we explicitly put it on window to make it clear we want it global.  We don't use 'var' since that isn't explicit about our intentions.
//      - it becomes global b/c 'window' is a global variable automatically created by what? - 'window' is the global namespace in javascript.
//          - NOTE:  node.js has global namespace called 'global' but we shouldn't ever write to it.  It provides some global methods for us.
//      - and it just adds nativeAPI as a property of that window object, right? - yes
//
//  I'm not clear:  when do we have to use window.xxx and when can we just use xxx?
//  - sometimes 'window' disappears.  Probably b/c immature coding, not sure what causes it.
//  - Note that we register our globals in .eslintrc.json.  Then eslint won't complain.  If we didn't, we'd always need to call window.xxx.
//  - main point:  be consistent on how we call xxx.  Always use window.xxx, or always xxx.
window.nativeAPI = {

    initialize() {
        this.deserializeFile = this.deserializeFile.bind(this);

        return new Promise(resolve => {
            co(function*() {
                try {

                    const win = nw.Window.get();
                    win.focus();

                    const platform = process.platform;

                    const defaultDataPath = nw.App.dataPath;
                    let dataPath;

                    if (platform === 'darwin') {
                        dataPath = path.resolve(defaultDataPath, '..');
                    } else if (platform === 'win32') {
                        dataPath = path.resolve(defaultDataPath, '..', '..');
                    } else {
                        dataPath = defaultDataPath;
                    }

                    this.win = win;
                    this.platform = platform;
                    this.dataPath = dataPath;

                    // if our data doesn't match what is already saved, ask the user if they want to save changes.
                    win.on('close', () => {
                        let doClose = true;

                        if (this._mainComponent) {
                            const {state} = this._mainComponent;

                            if (state.loadedFile) {
                                const fileData = this.deserializeFile(state.loadedFile);
                                const serializedFileData = serializeInternal(fileData.data, fileData.locale);
                                const serializedStateData = serializeInternal(state.data, state.locale);

                                if (fileData.locale !== state.locale ||
                                    serializedFileData !== serializedStateData) {
                                    doClose = false;
                                    // why isn't swal happening? - need window.swal here
                                    window.swal({
                                            title: 'Unsaved changes!',
                                            text: 'Are you sure you want to close without saving your changes?',
                                            type: 'warning',
                                            confirmButtonText: 'Lose changes',
                                            showCancelButton: 'true'
                                        },
                                        () => win.close(true));
                                }
                            }
                        }

                        if (doClose) {
                            win.close(true);
                        }
                    });

                    // win.showDevTools(); // so we get the devTools every time we run, instead of having to go through the Window menu and clicking DevTools.

                    resolve();

                } catch (err) {
                    alert(`ERROR - ${err.message}`);
                    this.handleError(err);
                }
            }.bind(this));

        });
    },

    registerMainComponent(component) {
        this._mainComponent = component;
    },

    // Why can't I do this, then reference it in deserialize() below?
    //  - javascript isn't great for object oriented.  You can lose 'this' at seemingly random times.
    //      Easiest solution:  bind to nativeApi (see top of App.jsx), rather than trying to track down exactly where
    //      'this' gets lost.
    //  - this is why javascript is better with functional programming - you don't get weirdness like this.
    readFile(filePath) {
        return fs.readFileSync(path.normalize(filePath), 'utf8');
    },

    writeFile(filePath, data) {
        return fs.writeFileSync(path.normalize(filePath), data, 'utf8');
    },

    CreateLocalesEnJson(newPath) {
        const folder = path.join(path.dirname(newPath), 'locales');
        fs.ensureDirSync(folder);
        const finalPath = path.join(folder, 'en.json');
        fs.writeJsonSync(finalPath, { "locale": "en-US" });
        return finalPath;
    },

    Clipboard: nw.Clipboard,

    deserializeFile(newPath) {
        window.console.log(this);
        const fileData = this.readFile(newPath);
        const data = JSON.parse(fileData);
        const deserializedData = deserialize(data);
        return deserializedData;
    },

    serialize(data, locale) {
        return serializeInternal(data, locale);
    },

    createNewDataObject(context, key, value) {
        return createNewDataObjectInternal(context, key, value);
    },

    handleError(err) {
        console.error(err);
        swal('Oops!', err.message, 'error');
    }
};

process.on('uncaughtException', err => {
    nativeAPI.handleError(err);
});
