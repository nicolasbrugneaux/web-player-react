import Songs from '../store/Songs';
import React from 'react';
import cx from 'classnames';
import actions from '../actions/';
/* jshint ignore:start */
import DropZone from './dropzone.jsx';
import Cover from './cover.jsx';
import Controls from './controls.jsx';
/* jshint ignore:end */
import { wavesurfer } from '../wavesurfer';

export default class Player extends React.Component
{
    constructor()
    {
        this.state = this._getState();
    }

    _getState()
    {
        return {
            currentSong: Songs.getCurrent(),
            songs: Songs.getAll()
        };
    }

    _onChange()
    {
        this.setState( this._getState() );
    }

    componentDidMount()
    {
        wavesurfer = wavesurfer.getInstance();

        wavesurfer.on( 'ready', () => wavesurfer.play() );

        wavesurfer.on( 'finish', () => actions.next() );

        wavesurfer.on( 'seek', () => Songs.setCurrentTime( wavesurfer.getCurrentTime() ) );

        Songs.addChangeListener( this._onChange.bind( this ) );
    }

    componentWillUnmount()
    {
        Songs.removeChangeListener( this._onChange.bind( this ) );
    }

    render()
    {
        /* jshint ignore:start */
        return (
            <div className={cx({
                'webplayer': true,
                'disabled': this.state.songs.size === 0
            })}>
                <Cover current={this.state.currentSong} />
                <div id="wave" className="wave" />
                <Controls songs={this.state.songs} />
                <DropZone/>
            </div>
        );
        /* jshint ignore:end */
    }
}
