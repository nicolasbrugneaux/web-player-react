export function formatTime( time )
{
    let _time = Math.round( time );

    let minutes = Math.floor( _time / 60 );
    let seconds = _time - minutes * 60;

    seconds = seconds < 10 ? '0' + seconds : seconds;

    return minutes + ":" + seconds;
}
