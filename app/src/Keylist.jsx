import React from 'react';
import PropTypes from 'prop-types';
import co from 'co';
import {promiseAlert, swal} from 'promise-alert';

import KeylistItem from './KeylistItem.jsx';

const Keylist = ({dataForContext, selectedContext, filter, windowHeight, keyValueChanged, addNewKeyValue, deleteContext, deleteKeyValue, filterChanged}) => {

    const styles = {
        div1: {
            width: '100%',
            marginBottom: 10
        },
        div2: {
            width: '80%'
        },
        // how to compute the height programmatically instead of hardcoding it?
        // - can get height of components, but not worth the hassle.  Every component would have to have it's own
        //      event handler to monitor height change (i.e., if screen gets too small, header will wrap, which means
        //      the component's height will change).  The normal way to do this is to hard-code a number.
        listContainer: {
            width: '100%',
            height: windowHeight - 150,
            overflowY: 'auto',
            overflowX: 'hidden'
        },
        h1: {
            display: 'inline-block',
            margin: 0,
            padding: 0,
            maxWidth: '75%'
        },
        deleteContext: {
            margin: 5,
            fontSize: '.8em'
        },
        trash: {
            marginRight: 5
        }
    };

    let currentFilter;

    const onDeleteContextClick = e => {
        e.preventDefault();

        swal({
                title: 'Are you sure?',
                text: 'You will not be able to recover this imaginary file!',
                type: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#DD6B55',
                confirmButtonText: 'Yes, delete it!',
                closeOnConfirm: true
            },
            () => deleteContext(selectedContext));
    };

    const addKeyValue = () => {
        addNewKeyValue(selectedContext, '', '');

        // Using jquery is more reliable than using React, because React is very good at not re-rendering stuff it doesn't need to.
        // Give 100 ms before setting focus, to be sure any rendering/DOM changes have settled down.
        setTimeout(() => {
            // jquery call on a class returns an array
            const $targets = $('.js-mainValueInput');
            if ($targets.length > 0) {
                $targets[0].focus();
            }
        }, 100);
    };

    const onAddKeyValueClick = e => {
        e.preventDefault();
        addKeyValue();
    };

    // is there any way to have this in App, and have App call a function in Keylist?
    // - it's a bad idea to have a higher object (App) call a function on a lower object (Keylist).
    //   That goes against the React way of doing things.
    // However, we could add the keydown event handler to the document, above React.
    //  We should do that here, so we can call addKeyValue() here.
    //  See https://jsfiddle.net/ryanburgett/njr3nmm8/
    const onKeyDown = e => {
        if (e.key === 'Enter' && (e.shiftKey || e.ctrlKey)) {
            e.preventDefault();
            addKeyValue();
        }
    };

    const onFilterChange = e => {
        e.preventDefault();

        filterChanged(currentFilter.value);
    };

    // generate a KeylistItem for every key-value pair in this context
    const allItems = (context) => {
        if (context) {
            return dataForContext
                .map(kv => {
                    return {
                        ...kv,
                        valueIsDuplicate: dataForContext.filter(e => e.value === kv.value).length > 1,
                        keyIsDuplicate: dataForContext.filter(e => e.key === kv.key).length > 1
                    };
                })
                // if we want to sort by key:
                //.sort((a, b) => Object.keys(a)[0] < Object.keys(b)[0] ? -1 : Object.keys(a)[0] > Object.keys(b)[0] ? 1 : 0)
                .map(kv => <li key={kv.id}>
                    <KeylistItem keyValue={kv} selectedContext={context} keyValueChanged={keyValueChanged}
                                 deleteKeyValue={deleteKeyValue} />
                </li>);
        }
    };

    const getHeader = (context) => {
        if (context) {
            return (
                <div>
                    {/* it is no longer necessary to disable the button when there already is a blank key,
                     since we no longer use the key as the unique identifier.  We now use id's.
                     disabled={ dataForContext.findIndex(kv => kv.key === '') > -1 ? 'disabled' : '' }*/}
                    <button title="Add new key (ctrl/shift-enter)" type="button" className="pull-right btn btn-primary"
                            onClick={onAddKeyValueClick}>
                        <span className="glyphicon glyphicon-plus" />
                    </button>
                    <button className="btn btn-danger btn-sm conDelBtn pull-left" style={styles.deleteContext}
                            type="button" onClick={onDeleteContextClick}>
                        <span style={styles.trash} className="glyphicon glyphicon-trash" /> Delete Context
                    </button>
                    <div className="form-horizontal">
                        <h1 className="col-lg-4" style={styles.h1}>{context}</h1>
                        <div className="form-group">
                            {/* we don't need this, since the placeholder text is clear as to what the textbox is for.
                             <label className="col-lg-1 control-label">Filter:</label>  */}
                            <div className="col-lg-6">
                                <input ref={node => currentFilter = node} type="text"
                                       className="form-control input-lg js-filterInput"
                                       value={filter} placeholder="Unfiltered" onChange={onFilterChange} />
                            </div>
                        </div>
                    </div>
                </div>
            );
        }
    };

    return (
        <div onKeyDown={onKeyDown}>
            <div className="row" style={styles.div1}>
                <div style={styles.div1}>
                    {getHeader(selectedContext)}
                </div>
            </div>
            <div className="row">
                <div className="col-xs-12">
                    <div style={styles.listContainer}>
                        <ul className="list-unstyled">
                            {allItems(selectedContext)}
                        </ul>
                    </div>
                </div>
            </div>

        </div>
    );

    // When to use styles, and when to use classes?  Are the classes all from bootstrap, or do we have access to others?
    // - styles trump classes
    // - add the general bootstrap classes, then tweak as needed with styles
};

Keylist.propTypes = {
    dataForContext: PropTypes.array,
    selectedContext: PropTypes.string,
    filter: PropTypes.string,
    windowHeight: PropTypes.number,
    keyValueChanged: PropTypes.func,
    addNewKeyValue: PropTypes.func,
    deleteContext: PropTypes.func,
    deleteKeyValue: PropTypes.func,
    filterChanged: PropTypes.func
};

export default Keylist;
