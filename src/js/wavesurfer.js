import WaveSurfer from './vendor/wavesurfer';
import { readFile } from './ID3';
import actions from './actions/';

let _wavesurfer = Object.create( WaveSurfer );
let created = false;

export const wavesurfer = ( () =>
{
    return {
        getInstance: () =>
        {
            if ( !created )
            {
                let div = document.createElement( 'div' );

                _wavesurfer.init(
                {
                    container: div,
                    cursorColor: '#aaa',
                    cursorWidth: 1,
                    height: 80,
                    waveColor: '#588efb',
                    progressColor: '#f043a4'
                } );
                created = true;
            }

            return _wavesurfer;
        }
    };

} )();

export const loadSong = ( song ) =>
{
    readFile( song.audioTrack, () =>
    {
        let _blob = song.audioTrack;
        _wavesurfer.loadBlob( _blob );
    } );
};

export const playSong = () => _wavesurfer.play();

export const isInitialized = () => created;

export const stopSong = () => _wavesurfer.stop();

export const pauseSong = () => _wavesurfer.pause();

export const getDuration = () => _wavesurfer.getDuration();

export const getCurrentTime = () => _wavesurfer.getCurrentTime();
