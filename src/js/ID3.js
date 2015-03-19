import { ID3, FileAPIReader } from './vendor/ID3.js';


export const getID3Data = ( file, done ) =>
{
    getTags( file, ( result ) =>
    {
        result.audioTrack = file;
        result.playing = false;
        done( result );
    } );
};

export const getTags = ( file, done ) =>
{
    let result = {};

    ID3.loadTags( file.name, () =>
    {
        let tags = ID3.getAllTags( file.name );

        result.artist = tags.artist || 'Unknown Artist';
        result.title = tags.title || 'Unknown';
        result.album = tags.album || '';

        if ( tags.picture && tags.picture.data && tags.picture.data.length )
        {
            result.picture = getImageSource( tags.picture );
            done( result );
        }
        else
        {
            result.picture = null;
            done( result );
        }
    },
    {
        tags: ['artist', 'title', 'album', 'picture'],
        dataReader: FileAPIReader( file )
    } );

};

export const getImageSource = ( image ) =>
{
    let base64String = window.btoa( [].reduce.call( image.data, ( acc, next ) =>
    {
        return acc + String.fromCharCode( next );
    }, '' ) );

    return 'data:' + image.format + ';base64,' + base64String;
};


export const readFile = ( file, done ) =>
{
    let reader = new FileReader();
    reader.onload = ( data ) => done( data );
    reader.readAsDataURL( file );
};
