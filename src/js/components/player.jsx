import Songs from '../store/songs';
import React from 'react';
import cx from 'classnames';
import actions from '../actions/';
/* jshint ignore:start */
import DropZone from './dropzone.jsx';
import Cover from './cover.jsx';
import Controls from './controls.jsx';
import ProgressBar from './progress.jsx';
/* jshint ignore:end */

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
                <ProgressBar current={this.state.currentSong} />
                <Controls songs={this.state.songs} />
                <DropZone/>
            </div>
        );
        /* jshint ignore:end */
    }
}
