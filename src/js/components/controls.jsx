import React from 'react';
import actions from '../actions/';
import Songs from '../store/songs';
/* jshint ignore:start */
import cx from 'classnames';
import Playlist from './playlist.jsx';
/* jshint ignore:end */

export default class Controls extends React.Component
{
    constructor()
    {
        this.state = this._getState();
    }

    _getState()
    {
        return {
            playing: Songs.getPlayingState(),
            shuffle: Songs.getShuffleState(),
            repeat: Songs.getRepeatState()
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

    _togglePlay()
    {
        actions.togglePlay();
    }

    _stop()
    {
        actions.stop();
    }

    _previous()
    {
        actions.previous();
    }

    _next()
    {
        actions.next();
    }

    _toggleShuffle()
    {
        actions.toggleShuffle();
    }

    _circleRepeat()
    {
        actions.circleRepeat();
    }

    render()
    {
        /* jshint ignore:start */
        return (
            <div className='control-bar'>
                <div className='player-control'>
                    <div className='previous-button' onClick={this._previous}>
                        <i className='fa fa-fast-backward'/>
                    </div>
                    <div className='play-button' onClick={this._togglePlay}>
                        <i className={this.state.playing ?
                            'fa fa-pause' : 'fa fa-play'}/>
                    </div>
                    <div className='stop-button' onClick={this._stop}>
                        <i className='fa fa-stop'/>
                    </div>
                    <div className='next-button' onClick={this._next}>
                        <i className='fa fa-fast-forward'/>
                    </div>
                    <div className={cx({
                        'shuffle-button': true,
                        'active': this.state.shuffle
                    })} onClick={this._toggleShuffle}>
                        <i className='fa fa-random'/>
                    </div>
                    <div className={cx({
                        'repeat-button': true,
                        'active': parseInt( this.state.repeat, 10 ) > 0
                    })} onClick={this._circleRepeat.bind( this )}>
                        <i className='fa fa-refresh'/>
                    </div>
                </div>
                <Playlist songs={this.props.songs} />
            </div>
        );
        /* jshint ignore:end */

    }
}
