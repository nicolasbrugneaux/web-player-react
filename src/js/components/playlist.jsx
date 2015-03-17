import React from 'react';
import { formatTime, levenshtein, fuzzyMatch } from '../utils';
import Songs from '../store/songs';
import Song from './song.jsx';
import cx from 'classnames';

let interval;

export default class Playlist extends React.Component
{
    /* jshint ignore: start */
    // static propTypes =
    // {
    //     current : React.PropTypes.object.isRequired
    // };
    /* jshint ignore: end */

    constructor()
    {
        this.state = this._getState();
    }

    _getState()
    {
        let songs = Songs.getAll();
        let current = Songs.getCurrent();
        return {
            currentTime: current &&
                ( Songs.getPlayingState() || Songs.getPausedState() ) ?
                formatTime( Songs.getCurrentSongTime() ) : '-',
            songLength: current &&
                ( Songs.getPlayingState() || Songs.getPausedState() ) ?
                formatTime( Songs.getCurrentSongLength() ) : '-',
            songs,
            current,
            collapsed: true
        };
    }
    _onChange()
    {
        this.setState( this._getState() );
    }

    componentDidMount()
    {
        interval = setInterval( this._updateTime.bind( this ), 1000 );
        Songs.addChangeListener( this._onChange.bind( this ) );
    }

    componentWillUnmount()
    {
        clearInterval( interval );
        Songs.removeChangeListener( this._onChange.bind( this ) );
    }

    _updateTime()
    {
        let currentTime = this.state.current &&
            ( Songs.getPlayingState() || Songs.getPausedState() ) ?
            formatTime( Songs.getCurrentSongTime() ) : '-';
        let songLength = this.state.current  &&
            ( Songs.getPlayingState() || Songs.getPausedState() ) ?
            formatTime( Songs.getCurrentSongLength() ) : '-';

        if ( currentTime !== this.state.currentTime )
        {
            this.setState( { currentTime } );
        }
        if ( songLength !== this.state.songLength )
        {
            this.setState( { songLength } );
        }
    }

    _showPlaylist()
    {
        this.setState( { collapsed: !this.state.collapsed } );
    }

    _search()
    {
        let query = this.refs.searchTextInput.getDOMNode().value.toLowerCase().trim();
        let songs = Songs.getAll();
        if ( query )
        {
            songs = fuzzyMatch( songs, query ).sort( ( a, b ) =>
            {
                return levenshtein( a.title.toLowerCase(), query ) -
                    levenshtein( b.title.toLowerCase(), query );
            } );

            this.setState( { songs } );
        }
        else
        {
            this.setState( { songs } );
        }
    }

    render()
    {
        /* jshint ignore:start */
        return (
            <div className='playlist'>
                { this.state.current ?
                    <div className='track-details' title='Show Playlist' onClick={this._showPlaylist.bind( this )}>
                        <i className='fa fa-sort'/>
                        <p className='track-description'>
                            <b>{this.state.current.title}</b> — {this.state.current.artist}
                        </p>
                        <p className='track-time'>
                            {this.state.currentTime} / {this.state.songLength}
                        </p>
                    </div> :
                    <div className='track-details' title='No selected song'>
                        <p className='track-description'>
                            There are no tracks loaded in the player.
                        </p>
                    </div> }
                { this.state.songs.size > 0 ?
                    <div className={cx({
                        'expand-bar': true,
                        'hidden': this.state.collapsed
                    })}>
                        <form>
                            <label htmlFor='searchBox'>Search</label>
                            <div>
                                <input
                                    value={this.props.searchText}
                                    ref="searchTextInput"
                                    onChange={this._search.bind( this )}
                                    className='searchBox' id='searchBox' type='search' name='search'/>
                            </div>
                        </form>
                        <ul className='list'>
                            {this.state.songs.map( ( song, index ) =>
                            {
                                return <Song key={'song-' + index}
                                             song={song}
                                             id={index}
                                             active={song === this.state.current}/>
                            } )}
                        </ul>
                    </div> : null }
            </div>
        );
        /* jshint ignore:end */

    }
}
