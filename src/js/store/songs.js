/**
 * `client/store/index.js`
 *
 * @author  Nicolas Brugneaux <nicolas.brugneaux@sociomantic.com>
 *
 * @content     Store the values, it's roughly a EventEmitter subclass
 *
 * @package     Mermaid
 */

import constants from '../constants';
import Dispatcher from '../dispatcher';
import EventEmitter from 'eventemitter3';
import { List } from 'immutable';

let _playlist = new List();
let _shufflePlayList = new List();
let _current = 0;
let _playing = false;
let _paused = false;
let _shuffle = localStorage.getItem( 'WebPlayer.shuffle' ) === 'true';
let _repeat = localStorage.getItem( 'WebPlayer.repeat' ) || '0';

const shuffle = ( list, keepCurrent=true ) =>
{
    let _list = new List( list );
    let skip = -1;
    let l;

    if ( keepCurrent )
    {
        _list = _list.push( list.get( _current ) );
        skip = _current;
        l = list.size;
    }
    else
    {
        l = list.size + 1;
    }
    while ( l-- )
    {
        if ( l === skip )
        {
            continue;
        }

        let r = ~~( Math.random() * l );
        let o = list.get( r );

        _list = _list.set( r, list.get( 0 ) );
        _list = _list.set( 0, o );
    }

    return _list;
};


class Store extends EventEmitter
{
    getPlayingState()
    {
        return _playing;
    }

    play( start )
    {
        ( _shuffle ? _shufflePlayList : _playlist ).get( _current ).play( start );

        _paused = false;
        _playing = true;
    }

    getPausedState()
    {
        return _paused;
    }

    pause()
    {
        let playlist = _shuffle ? _shufflePlayList : _playlist;

        if ( !_paused )
        {
            playlist.get( _current ).pause();
        }

        _playing = false;
        _paused = true;
    }

    stop()
    {
        let playlist = _shuffle ? _shufflePlayList : _playlist;

        playlist.get( _current ).stop();

        _playing = false;
        _paused = false;
    }

    getShuffleState()
    {
        return _shuffle;
    }

    shuffle()
    {
        _shuffle = true;
        _shufflePlayList = shuffle( _playlist, true );
        _current = 0;
        localStorage.setItem( 'WebPlayer.shuffle', _shuffle );
    }

    unshuffle()
    {
        _shuffle = false;
        if ( _shufflePlayList.size > 0 )
        {
            let index = _playlist.indexOf( _shufflePlayList.get( _current ) );
            _current =  index < -1 ? 0 : index;
            _shufflePlayList = new List();
        }

        localStorage.setItem( 'WebPlayer.shuffle', _shuffle );
    }

    getRepeatState()
    {
        return _repeat;
    }

    circleRepeat()
    {
        _repeat = ( ( parseInt( _repeat, 10 ) + 1 ) % 3 ) + '';
        localStorage.setItem( 'WebPlayer.repeat', _repeat );
    }

    previous()
    {
        this.stop();

        if ( !_shuffle )
        {
            if ( 0 === _current )
            {
                _current = _playlist.size - 1;
            }
            else if ( 0 < _current )
            {
                _current -= 1;
            }
        }
        else
        {
            if ( 0 === _current )
            {
                _current = _shufflePlayList.size - 1;
            }
            else if ( 0 < _current )
            {
                _current -= 1;
            }
        }

        this.play();
    }

    next()
    {
        this.stop();

        if ( !_shuffle )
        {
            if ( _playlist.size - 1 === _current )
            {
                _current = 0;
            }
            else if ( _playlist.size - 1 > _current )
            {
                _current += 1;
            }
        }
        else
        {
            if ( 0 === _current )
            {
                _current = _shufflePlayList.size - 1;
            }
            else if ( 0 < _current )
            {
                _current -= 1;
            }
        }

        this.play();
    }

    getCurrentSongLength()
    {
        return ( _shuffle ? _shufflePlayList : _playlist ).get( _current ).getDuration();
    }

    setCurrentTime()
    {
        this.emit( 'change' );
    }

    getCurrentSongTime()
    {
        return ( _shuffle ? _shufflePlayList : _playlist ).get( _current ).getCurrentTime();
    }

    getCurrent()
    {
        return _playlist.get( _current );
    }

    setCurrent( index )
    {
        if ( _playlist.size > index )
        {
            _current = index;
        }
    }

    getAll()
    {
        return _playlist;
    }

    get( value )
    {
        _playlist.get( value );
    }

    add( data )
    {
        _playlist = _playlist.push( data );
        if ( shuffle )
        {
            _shufflePlayList.push( data );
        }
    }

    remove( id )
    {
        _playlist = _playlist.remove( id );
        if ( shuffle )
        {
            _shufflePlayList.remove( id );
        }
    }

    clear()
    {
        _playlist = _playlist.clear();
    }

    addChangeListener( callback )
    {
        this.on( 'change', callback );
    }

    removeChangeListener( type, callback )
    {
        this.removeListener( 'change', callback );
    }
}

const songs = new Store();

/**
 * Register the different events that the Store listens to onto the Dispatcher.
 */
Dispatcher.register( function( action )
{
    switch( action.actionType )
    {
        case constants.ADD_SONG:
            if ( action.data )
            {
                songs.add( action.data );
                if ( !_current )
                {
                    _current = 0;
                }
                songs.emit( 'change' );
            }
            break;

        case constants.ADD_SONGS:
            if ( action.data )
            {
                action.data.forEach( ( song ) =>
                {
                    songs.add( song );
                } );
                songs.emit( 'change' );
            }
            break;

        case constants.REMOVE_SONG:
            songs.remove( action.index );
            songs.emit( 'change' );
            break;

        case constants.REMOVE_ALL:
            songs.clear();
            songs.emit( 'change' );
            break;

        case constants.PLAY:
            if ( _playing )
            {
                songs.pause();
            }
            else
            {
                songs.play();
            }
            songs.emit( 'change' );
            break;
        case constants.STOP:
            if ( _playing )
            {
                songs.stop();
                songs.emit( 'change' );
            }
            break;
        case constants.SHUFFLE:
            if ( !_shuffle )
            {
                songs.shuffle();
            }
            else
            {
                songs.unshuffle();
            }
            songs.emit( 'change' );
            break;
        case constants.REPEAT:
            songs.circleRepeat();
            songs.emit( 'change' );
            break;
        case constants.PREVIOUS:
            songs.previous();
            songs.emit( 'change' );
            break;
        case constants.NEXT:
            songs.next();
            songs.emit( 'change' );
            break;

        case constants.SELECT:
            songs.setCurrent( action.index );
            songs.emit( 'change' );
            break;

        default:
            // no op
            break;
    }
} );

export default songs;
