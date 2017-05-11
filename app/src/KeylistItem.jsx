import React from 'react';
import PropTypes from 'prop-types';

const {Clipboard} = nativeAPI;

// To set focus in the Value textbox per https://facebook.github.io/react/docs/refs-and-the-dom.html we could change
//  this to a class because we'd need lifecycle methods.  But:
// when forced to work with the DOM, jquery is usually easier than using React.  Just need to make sure we don't change anything in the DOM that interferes with React rendering.
//  In this case, we simply add the class js-mainValueInput to the item we want to set focus in, and use jquery to set focus in Keylist.jsx.
//const KeylistItem = ({keyValue, selectedContext, keyValueChanged, deleteKeyValue}) => {
class KeylistItem extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            handlebarsHighlight: false,
            javascriptHighlight: false
        };
    }

    render() {
        const {keyValue, selectedContext, keyValueChanged, deleteKeyValue} = this.props;

        const styles = {
            border: {
                borderStyle: 'solid',
                borderColor: '#AAAAAA',
                borderWidth: 1,
                padding: 10,
                marginBottom: 10
            },
            formControl: {
                fontFamily: 'monospace'
            },
            highlight: {
                backgroundColor: '#77FF99'
            },
            duplicate: {
                backgroundColor: '#FF7777'
            },
            deleteKey: {
                marginTop: 0,
                marginRight: 0
            }
        };

        /*const myKey = Object.keys(keyValue)[0];
         //const myValue = Object.values(keyValue)[0];
         //Object.values(keyValue)[0];  Object.values() is not supported yet, but I added object.values and object.entries packages
         // so I could use it now if I wanted.
         // es7shim - shims, whereas babel transpiles.  Since es7shim includes stuff that babel handles, and we don't need
         //  the other stuff in es7shim, we just use babel.
         // babel also has a shim, for when we write for browsers instead of node.js.
         const myValue = keyValue[myKey];*/
        const jsValue = keyValue.key === '' ? '' : `Localize.text(\'${keyValue.key}\', \'${selectedContext}\')`;
        const handlebarValue = keyValue.key === '' ? '' : `{{formatMessage (intlGet \"${keyValue.key}.${selectedContext}.val\")}}`;
        const copyHandlebarsTitle = 'Copy the Handlebars text to the clipboard (meta-h)';
        const copyJavascriptTitle = 'Copy the Javascript text to the clipboard (meta-j)';

        let currentKey;
        let currentValue;
        let currentNotes;

        // Can we update state without passing everything back up through keylist? - no with just React.  That's a benefit of Redux.
        // When not using Redux, setState should only be called in App, to avoid confusion of state being changed all over.
        const onItemChange = e => {
            e.preventDefault();

            keyValueChanged(keyValue.id, currentKey.value, currentValue.value, currentNotes.value);
        };

        const onDeleteItemClick = e => {
            e.preventDefault();

            deleteKeyValue(keyValue.id);
        };

        const doCopy = textToCopy => {
            // see http://docs.nwjs.io/en/latest/References/Clipboard/
            Clipboard.get().set(textToCopy);
        };

        const onCopyClick = (e, textToCopy) => {
            e.preventDefault();

            doCopy(textToCopy);

            // FYI: notes re: event handlers
            // e.target is the item actually clicked on (could be a span or something).
            // e.currentTarget is the item that has the handler.
            // console.log happens after e is done - asynchronous.  So expand it into a new variable, then log the new variable:
            //const myE = {...e};
            //console.log(myE, myE.target);
        };

        const onKeyDown = e => {
            // briefly change the background color of the text we copy, so the user knows the copy happened.
            if (e.metaKey) {
                // NOTE:  we must NOT call e.preventDefault() unless we fall into one of the if's below.
                //  if we call it here, we lose our copy/paste, since those both use the meta key.
                if (e.key === 'h') {
                    e.preventDefault();
                    doCopy(handlebarValue);
                    this.setState({handlebarsHighlight: true});
                    setTimeout(() => this.setState({handlebarsHighlight: false}), 500);
                } else if (e.key === 'j') {
                    e.preventDefault();
                    doCopy(jsValue);
                    this.setState({javascriptHighlight: true});
                    setTimeout(() => this.setState({javascriptHighlight: false}), 500);
                }
            }
        };

        return (
            <div style={styles.border} onKeyDown={onKeyDown}>
                <button title="Delete key" type="button" className="pull-right btn btn-danger btn-sm"
                        style={styles.deleteKey} onClick={onDeleteItemClick}>
                    <span className="glyphicon glyphicon-trash" />
                </button>
                <div className="form-horizontal">
                    {/* use flexbox if need to fine-tune UI:  https://css-tricks.com/snippets/css/a-guide-to-flexbox/.  Otherwise, be happy with bootstrap's 12 columns. */}
                    <div className="form-group">
                        <label className="col-lg-1 control-label">Value</label>
                        {/* when we create a non-styling class, prefix it with 'js-' and camelCase */}
                        <div className="col-lg-10">
                            <input ref={node => currentValue = node} type="text"
                                   className="form-control input-lg js-mainValueInput" style={
                                Object.assign({}, keyValue.valueIsDuplicate ? styles.duplicate : {})}
                                   value={keyValue.value} placeholder="Value" onChange={onItemChange} />
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="col-lg-1 col-md-2 control-label">Key</label>
                        {/* with React, we get our data from the state only.  The DOM doesn't keep our data:  it is a reflection of our data.
                         - so, we never need to create a custom attribute. */}
                        <div className="col-lg-10">
                            <input ref={node => currentKey = node} type="text" className="form-control input-lg"
                                   style={Object.assign({}, keyValue.keyIsDuplicate ? styles.duplicate : {})}
                                   value={keyValue.key} placeholder="Key" onChange={onItemChange} />
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="col-lg-1 col-md-2 control-label">Notes</label>
                        <div className="col-lg-10">
                            <input ref={node => currentNotes = node} type="text" className="form-control input-lg"
                                   value={keyValue.notes} placeholder="Notes" onChange={onItemChange} />
                        </div>
                    </div>
                    {/* we don't need to list the context since we have it in bold at the top.
                     <div className="form-group">
                     <label className="col-lg-1 control-label">Context</label>
                     <div className="col-lg-10">
                     <input type="text" className="form-control input-sm" value={selectedContext} readOnly={true} />
                     </div>
                     </div>
                     */}
                </div>
                <div className="row">
                    {/*<div className="col-sm-9">*/}
                    <form className="form-horizontal">
                        <div className="row">
                            <div className="form-group form-group-sm">
                                <label className="col-sm-2 control-label">Handlebars</label>
                                <div className="col-sm-8">
                                    <input className="form-control js-handlebarsText" style={
                                        Object.assign({}, styles.formControl, this.state.handlebarsHighlight ? styles.highlight : {})}
                                           type="text"
                                           value={handlebarValue} readOnly={true} />
                                </div>
                                <div className="col-sm-1">
                                    <button type="button" className="btn btn-default btn-sm"
                                            title={copyHandlebarsTitle}
                                            onClick={e => onCopyClick(e, handlebarValue)}>
                                        <span className="glyphicon glyphicon-copy" />
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="row">
                            <div className="form-group form-group-sm">
                                <label className="col-sm-2 control-label">JavaScript</label>
                                <div className="col-sm-8">
                                    <input className="form-control js-javascriptText" style={
                                        Object.assign({}, styles.formControl, this.state.javascriptHighlight ? styles.highlight : {})}
                                           type="text"
                                           value={jsValue} readOnly={true} />
                                </div>
                                <div className="col-sm-1">
                                    <button type="button" className="btn btn-default btn-sm"
                                            title={copyJavascriptTitle} onClick={e => onCopyClick(e, jsValue)}>
                                        <span className="glyphicon glyphicon-copy" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        );
    }
}

KeylistItem.propTypes = {
    keyValue: PropTypes.object,
    selectedContext: PropTypes.string,
    keyValueChanged: PropTypes.func,
    deleteKeyValue: PropTypes.func
};

export default KeylistItem;
