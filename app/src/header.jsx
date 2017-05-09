import React from 'react';
import PropTypes from 'prop-types';

const Header = ({loadedFile}) => {

    const styles = {
        brand: {
            color: '#9D9D9D',
            cursor: 'default'
        },
        path: {
            color: '#AAFFAA'
        },
        file: {
            color: '#55FF55'
        }
    };

    const slashIdx = loadedFile.lastIndexOf('/') + 1;
    const backslashIdx = loadedFile.lastIndexOf('\\') + 1;
    const fileIdx = Math.max(slashIdx, backslashIdx);

    const fileText = loadedFile.slice(fileIdx);
    const pathText = loadedFile.substring(0, fileIdx);

    const spacing = '\xa0\xa0\xa0'; // non-breaking spaces, to force horizontal spacing

    return (
        <div className="navbar navbar-inverse navbar-fixed-top">
            <div className="container-fluid">
                <div className="navbar-header">
                    <a className="navbar-brand" href="#" onClick={e => e.preventDefault()} style={styles.brand}>
                        {`Localization Helper ${spacing}`}
                        <span style={styles.path}>{pathText}</span>
                        <span style={styles.file}>{fileText}</span>
                    </a>
                </div>
            </div>
        </div>
    );
};

Header.propTypes = {
    loadedFile: PropTypes.string
};

export default Header;
