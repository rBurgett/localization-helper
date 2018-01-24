import React from 'react';
import PropTypes from 'prop-types';
import co from 'co';
// Why doesn't this import work? because swal is not a default export (see end of App)
//import swal from 'promise-alert';
// instead, use object destructuring:
import {promiseAlert, swal} from 'promise-alert';
// another option:
//  import * as promiseAlert from 'promise-alert';

const Sidebar = ({allContexts, selectedContext, myFile, windowHeight, filePathChanged, contextChanged, saveFile, addNewContext}) => {

    const styles = {
        loadBtnContainer: {
            marginBottom: 15
        },
        loadBtn: {
            marginBottom: 15
        },
        saveBtnContainer: {
            display: 'none',
            marginBottom: 15
        },
        saveBtn: {
            width: '100%',
            marginBottom: 15
        },
        contextControls: {
            marginBottom: 15
        },
        contexts: {
            margin: 0,
            padding: 0
        },
        listContainer: {
            width: '100%',
            height: windowHeight - 220,
            overflowY: 'auto'
        },
        contextItem: {
            fontSize: 16,
            whiteSpace: 'nowrap'
        },
        selectedContext: {
            backgroundColor: '#AABBFF',
            fontWeight: 'bold'
        },
        loadFile: {
            display: 'none'
        }
    };

    let fileInput;  // variable to store a reference to the <input> component, so we can use it in other code
    let fileSaveAs;
    let btnSave;
    let createFile = false;

    const fileIsLoaded = myFile.length > 0;

    const onAddContextClick = e => {
        e.preventDefault();

        // get the new context from the user
        co(function*() {
            //  So, anytime we want to get input from the user, we are stuck inside a co function,
            //  or else we have to use let above the co function and assign the value inside the co function.
            //  In other words, we are stuck with 1 level of extra nesting if we want to avoid 'let'.
            // see See http://t4t5.github.io/sweetalert/ and look for "inputs" or "replacement for prompt function"
            //  see also:  http://blog.burgettweb.net/2016/06/07/return-of-the-synchronous-alert-prompt-and-confirm/

            // validation:  verify this context does not already exist.  Need to do case-insensitive compare.
            let done = false;
            let newContext = '';
            while (!done) {
                newContext = yield promiseAlert({
                    title: 'Enter a new context',
                    text: 'Only characters A-Z a-z 0-9 and hyphen are allowed.',
                    type: 'input',
                    showCancelButton: true,
                    closeOnConfirm: false,
                    animation: 'slide-from-top',
                    inputPlaceholder: 'Use a hyphen to denote a sub-menu'
                });

                if (allContexts.findIndex(e => e === newContext) > -1) {
                    // this context already exists
                    yield promiseAlert({
                        title: 'Oops!',
                        text: `'${newContext}' already exists.`,
                        type: 'error',
                        closeOnConfirm: false
                    });
                } else if (/[^0-9a-zA-Z/-]/.test(newContext)) {
                    // validation:  verity this context consists of only a..zA..Z0..9-
                    // found an invalid character.
                    yield promiseAlert('Oops!', `'${newContext}' contains an invalid character.`, 'error');
                    return;
                } else {
                    done = true;
                }
            }

            swal.close();

            if (newContext) {
                // We have a valid new context.
                // So, update the state with the new context, and
                // set state.context to the new context so it will be selected
                addNewContext(newContext);
            }
        });
    };

    const onContextClick = e => {
        e.preventDefault();
        contextChanged(e.target.title); // pass the title of the context that was clicked
    };

    const onLoadFileClick = e => {
        e.preventDefault();

        // fileInput gets assigned as a reference to the <input> component in the definition of the <input> component below.
        //  So, we can programmatically trigger its click event.
        fileInput.click();

        // prevent double-click from triggering this twice.  Is there a better way?
        // - try just capturing onDoubleClick and e.preventDefault (see React synthetic events).
        //  - doesn't work:  we get 2 calls to onClick, followed by 1 call to onDoubleClick.
        // so, the method below seems best to me at this point.
        fileInput.setAttribute('disabled', 'disabled');
    };

    const onCreateFileClick = e => {
        e.preventDefault();

        createFile = true;
        fileInput.click();

        fileInput.setAttribute('disabled', 'disabled');
    };

    const onLoadFileInputChanged = (e) => {
        e.preventDefault();

        const {files} = e.target;   // e.target.files is an array of all selected files.  We only allow selecting 1 file.
        const [file] = files;   // sets file equal to first item in files array.  This is destructuring assignment for an array, above is the same thing for an object.
        filePathChanged(file.path, createFile);
    };

    const onSaveFileClick = e => {
        e.preventDefault();

        // prevent double-click
        btnSave.setAttribute('disabled', 'disabled');
        saveFile();

        // re-enable the button after 1/2 second
        setTimeout(() => btnSave.removeAttribute('disabled'), 500);
    };

    const onSaveAsClick = e => {
        e.preventDefault();

        // prevent double-click
        //btnSaveAs.setAttribute('disabled', 'disabled');
        // this doesn't work:  btnSaveAs is null, if we execute the fileSaveAs.click() timeout!
        //setTimeout(() => btnSaveAs.removeAttribute('disabled'), 1000);
        // - This is because React node references can be flaky - rendering may not be complete.  So, use jquery:
        $('#js-saveAsBtn').attr('disabled', true);
        setTimeout(() => $('#js-saveAsBtn').attr('disabled', false), 1000);

        // we use jquery to add the special nwsaveas attribute,
        //  b/c React only understands standard html attributes, so we can't use React for this.
        $(fileSaveAs).attr('nwsaveas', myFile);
        setTimeout(() => fileSaveAs.click(), 0);
    };

    const onSaveAsInputChanged = e => {
        e.preventDefault();

        const {files} = e.target;   // e.target.files is an array of all selected files.  We only allow selecting 1 file.
        const [file] = files;   // sets file equal to first item in files array
        saveFile(file.path);
    };

    const contextHeader = () => {
        if (fileIsLoaded) {
            // we have contexts, so show the label and button

            return (
                <div style={styles.contextControls}>
                    <button title="Add new context" type="button" className="pull-right btn btn-primary btn-sm"
                            onClick={onAddContextClick}>
                        <span className="glyphicon glyphicon-plus" />
                    </button>
                    <h2 style={styles.contexts}>Contexts</h2>
                </div>
            );
        }
    };

    const getContexts = (contexts) => {
        // format the contexts and list them

        if (contexts.length > 0) {
            return contexts
                .sort()     // alphabetize the contexts
                .map(a => {
                    return {
                        rawContext: a,
                        displayString: a.replace(/.*?-/g, '> ')
                    };
                })  // replace text up through a dash with '> ', for each dash.  This is our way of indenting sub-menus.
                .map(a => {
                    return (
                        <tr key={a.rawContext}
                            className={a.rawContext === selectedContext ? 'h4 active' : '' }>
                            {/* is a style with a hardcoded color, like selectedContext the normal way to visually show which is selected?
                             Or is there a way to use the color scheme the user has set for their OS?
                             - see bootstrap CSS stuff (use color schemes in helper classes http://bootstrapdocs.com/v3.3.6/docs/css/#helper-classes)
                             - can then change the color in 1 place and the whole app changes. */}
                            <td title={a.rawContext} onClick={onContextClick}>{a.displayString}</td>
                        </tr>);  // insert each context into a single-cell row
                });
        }
    };

    return (
        <div>
            {/* have to use Object.assign instead of object literal?
             - no, can do:
             style={{...styles.loadBtnContainer, display: fileIsLoaded ? 'none' : 'block'}}
             Is the whole point of Object.assign for contexts where {} is ambiguous?
             - no:  if I don't want to hard-code all options, Object.assign is nice because the last {} just means nothing else gets added.
             */}
            <div style={Object.assign({}, styles.loadBtnContainer, fileIsLoaded ? {display: 'none'} : {})}>
                <button title="Load locale file" type="button" className="btn btn-default"
                        style={styles.loadBtn} onClick={onLoadFileClick}>
                    <span className="glyphicon glyphicon-download-alt" /> Load Locale File
                </button>
            </div>
            <div style={Object.assign({}, styles.loadBtnContainer, fileIsLoaded ? {display: 'none'} : {})}>
                <button title="Select any file in a folder.  A 'locales' sub-folder will be created, with a new en.json." type="button" className="btn btn-default"
                        style={styles.loadBtn} onClick={onCreateFileClick}>
                    <span className="glyphicon glyphicon-file" /> Create en.json Locale File
                </button>
            </div>
            <div style={Object.assign({}, styles.saveBtnContainer, fileIsLoaded ? {display: 'inline'} : {})}>
                <button ref={node => btnSave = node} title="Save locale file" type="button" className="btn btn-default"
                        style={styles.saveBtn} onClick={onSaveFileClick}>
                    <span className="glyphicon glyphicon-save" /> Save Locale File
                </button>
            </div>
            <div style={Object.assign({}, styles.saveBtnContainer, fileIsLoaded ? {display: 'inline'} : {})}>
                <button id="js-saveAsBtn" title="Save As" type="button" className="btn btn-default"
                        style={styles.saveBtn} onClick={onSaveAsClick}>
                    <span className="glyphicon glyphicon-save" /> Save As...
                </button>
            </div>
            {contextHeader()}
            {/* Does node.js (or React, or Bootstrap) have anything like nwsaveas? http://nwjs.readthedocs.io/en/nw13/References/File%20Dialogs/#attribute-nwsaveas
             - nw marries node.js to window.  we use both.  see my updates in onSaveAsClick
             */}
            <input ref={node => fileInput = node} type="file" style={styles.loadFile}
                   onChange={onLoadFileInputChanged} />
            <input ref={node => fileSaveAs = node} type="file" style={styles.loadFile}
                   onChange={onSaveAsInputChanged} />

            <div>
                <div className="bg-info" style={styles.listContainer}>
                    <table className="table table-hover">
                        <tbody style={styles.contextItem}>
                        {getContexts(allContexts)}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>);
};

Sidebar.propTypes = {
    allContexts: PropTypes.array,
    selectedContext: PropTypes.string,
    myFile: PropTypes.string,
    windowHeight: PropTypes.number,
    filePathChanged: PropTypes.func,
    contextChanged: PropTypes.func,
    saveFile: PropTypes.func,
    addNewContext: PropTypes.func
};

export default Sidebar;
