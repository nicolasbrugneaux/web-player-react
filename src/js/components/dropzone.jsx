import React from 'react';
import cx from 'classnames';
import actions from '../actions/';
import { getID3Data } from '../ID3';
const forEach = ( arr, cb, thisArg=null ) => [].forEach.call( arr, cb.bind( thisArg ) );

export default class Dropzone extends React.Component
{
    constructor()
    {
        this.state =
        {
            hidden: true
        };
        window.addEventListener( 'dragover', this._show.bind( this ) );

    }

    _onDragOver( event )
    {
        event.stopPropagation();
        event.preventDefault();

        event.dataTransfer.dropEffect = 'copy';
    }

    _onDragLeave()
    {
        event.stopPropagation();
        event.preventDefault();

        this.setState( { hidden: true } );
    }

    _show()
    {
        this.setState( { hidden: false } );
    }

    _windowDragOver( event )
    {
        event.stopPropagation();
    	event.preventDefault();

        this._show();
    }

    _getSongFromTree( item, path='' )
    {
        if ( item.isFile )
        {
            item.file( ( file ) =>
            {
                if ( file.type.match(/audio\/mp3/ ) )
                {
                    getID3Data( file, ( song ) =>
                    {
                        actions.addSong( song );
                    } );
                }
            } );
        }
        else if ( item.isDirectory )
        {
            let dirReader = item.createReader();
            dirReader.readEntries( ( entries ) =>
            {
                entries.forEach( ( entry ) =>
                {
                    this._getSongFromTree( entry, path + item.name + '/' );
                } );
            } );
        }

    }

    _onDrop( event )
    {
        event.preventDefault();

        let items = event.dataTransfer.items;

        if ( items && items.length > 0 )
        {
            forEach( items, ( item ) =>
            {
                var _item = item.webkitGetAsEntry();
                if( _item )
                {
                    this._getSongFromTree( _item );
                }
            }, this );
        }

        this.setState( { hidden: true } );
    }

    render()
    {
        /* jshint ignore:start */
        return (
            <div className={cx({
                dropzone: true,
                hidden: this.state.hidden
            })} onDragLeave={this._onDragLeave.bind( this )}
                onDragOver={this._onDragOver.bind( this )}
                onDrop={this._onDrop.bind( this )}>Drag & Drop Files Here</div>
        );
        /* jshint ignore:end */

    }
}
