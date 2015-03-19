import EventEmitter from 'eventemitter3';

const readFile = ( file ) =>
{
    let reader = new FileReader();
    return new Promise( ( resolve, reject ) =>
    {
        reader.onload = ( data ) => resolve( data );
        reader.onerror = ( error ) => reject( error );
        reader.readAsDataURL( file );
    } );
};

const PLAYING_STATE = 0;
const PAUSED_STATE = 1;
const FINISHED_STATE = 2;

var STATES =
{
    playing:
    {
        init() {},
        getPlayedPercents()
        {
            var duration = this.getDuration();
            return ( this.getCurrentTime() / duration ) || 0;
        },
        getCurrentTime()
        {
            return this.startPosition + this.getPlayedTime();
        }
    },

    paused:
    {
        init() {},
        getPlayedPercents()
        {
            var duration = this.getDuration();
            return ( this.getCurrentTime() / duration ) || 0;
        },
        getCurrentTime()
        {
            return this.startPosition;
        }
    },

    finished:
    {
        init()
        {
            this.emit( 'finish' );
        },
        getPlayedPercents()
        {
            return 1;
        },
        getCurrentTime()
        {
            return this.getDuration();
        }
    }
};

let _AudioContext = window.AudioContext || window.webkitAudioContext;
let _createGain = _AudioContext.prototype.createGain || _AudioContext.prototype.createGainNode;
let audioCtx = new _AudioContext();
let gainNode = _createGain.call( audioCtx );
gainNode.connect( audioCtx.destination );
gainNode.gain.value = 0.8;

export default class Song extends EventEmitter
{
    constructor( song )
    {
        let { album, artist, audioTrack, picture, playing, title } = song;

        this.album = album;
        this.artist = artist;
        this.audioTrack = audioTrack;
        this.picture = picture;
        this.playing = playing;
        this.title = title;

        this.song = null;
        this.duration = null;
        this.playing = false;
        this.lastPlay = audioCtx.currentTime;
        this.startPosition = 0;
        this.scheduledPause = null;

        this.states =
        [
            Object.create( STATES.playing ),
            Object.create( STATES.paused ),
            Object.create( STATES.finished )
        ];

        this.setState( PAUSED_STATE );
    }

    setState( state )
    {
        if ( this.state !== this.states[state] )
        {
            this.state = this.states[state];
            this.state.init.call( this );
        }
    }

    decodeTrack( track )
    {
        return new Promise( ( resolve, reject ) =>
        {
            readFile( track ).then( () =>
            {
                let reader = new FileReader();

                reader.addEventListener( 'load', ( event ) =>
                {
                    let data = event.target.result;
                    this.offlineCtx.decodeAudioData( data, ( buffer ) =>
                    {
                        resolve( buffer );
                    } );
                } );

                reader.addEventListener( 'error', () =>
                {
                    reject( new Error( 'Error reading file' ) );
                } );

                reader.readAsArrayBuffer( track );
            } );
        } );
    }

    getBuffer()
    {
        return new Promise( ( resolve, reject ) =>
        {
            if ( this.buffer )
            {
                resolve( this.buffer );
            }

            this.offlineCtx = new window.OfflineAudioContext( 1, 2, 44100 );
            this.decodeTrack( this.audioTrack )
            .then( ( buffer ) =>
            {
                resolve( buffer );
            } )
            .catch( ( error ) =>
            {
                reject( error );
            } );
        } );
    }

    disconnect()
    {
        if ( this.source )
        {
            this.source.disconnect();
        }
    }

    getPlayedPercents()
    {
        return this.state.getPlayedPercents.call( this );
    }

    load( buffer )
    {
        this.startPosition = 0;
        this.lastPlay = audioCtx.currentTime;
        this.buffer = buffer;
        this.createSource( buffer );

        // return new Promise( ( resolve, reject ) =>
        // {
        //     let source = this.source = this.offlineCtx.createBufferSource();
        //     source.buffer = buffer;
        //     source.connect( this.offlineCtx.destination );
        //
        //     this.offlineCtx.oncomplete = ( event ) =>
        //     {
        //         let song = this.song = audioCtx.createBufferSource();
        //         song.buffer = event.renderedBuffer;
        //
        //         this.duration = song.buffer.duration;
        //
        //         song.connect( audioCtx.destination );
        //
        //         song.onended = () => this.emit( 'end' );
        //         song.start();
        //         resolve( song );
        //     };
        //
        //     this.offlineCtx.onerror = ( err ) =>
        //     {
        //         reject( new Error( 'Rendering failed: ' + err ) );
        //     };
        //
        //     this.offlineCtx.startRendering();
        // } );
    }

    unload()
    {
        if ( !this.isPaused() )
        {
            this.pause();
        }
        this.removeAllListeners();
        this.buffer = null;
        this.disconnect();

    }

    createSource( buffer )
    {
        this.disconnect();
        this.source = audioCtx.createBufferSource();
        this.source.buffer = buffer;
        this.source.connect( audioCtx.destination );

        return this.source;
    }

    getDuration()
    {
        return this.buffer ? this.buffer.duration : 0;
    }

    seekTo( start, end )
    {
        this.scheduledPause = null;

        if ( !start )
        {
            start = this.getCurrentTime();

            if ( start >= this.getDuration() )
            {
                start = 0;
            }
        }

        if ( !end )
        {
            end = this.getDuration();
        }

        this.startPosition = start;
        this.lastPlay = audioCtx.currentTime;

        if ( this.state === this.states[FINISHED_STATE] )
        {
            this.setState( PAUSED_STATE );
        }

        return { start, end };
    }

    getPlayedTime()
    {
        return audioCtx.currentTime - this.lastPlay;
    }

    getCurrentTime()
    {
        return this.state.getCurrentTime.call( this );
    }

    isPaused()
    {
        return this.state !== this.states[PLAYING_STATE];
    }

    play( _start=this.startPosition, _end=null )
    {
        this.getBuffer().then( ( buffer ) =>
        {
            this.load( buffer );

            let source = this.createSource( buffer );
            let { start, end } = this.seekTo( _start, _end );

            this.scheduledPause = end;

            source.start( 0, start, end - start );

            this.setState( PLAYING_STATE );
            this.startPosition = 0;
        }.bind( this ) );
    }

    pause()
    {
        this.scheduledPause = null;
        this.startPosition += this.getPlayedTime();

        if ( this.source )
        {
            this.source.stop( 0 );
        }

        this.setState( PAUSED_STATE );
    }

    //alias
    stop()
    {
        this.pause();
        this.startPosition = 0;
    }
}

export const setVolume = ( float ) =>
{
    if ( 0 < float && float > 1 )
    {
        gainNode.gain.value = float;
    }
};

export const getVolume = () =>
{
    return gainNode.gain.value;
};
