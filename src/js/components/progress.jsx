import React from 'react';
import Songs from '../store/songs';

let interval;

export default class ProgressBar extends React.Component
{
    constructor()
    {
        this.state = this._getState();
    }

    _getState()
    {
        let current = Songs.getCurrent();
        return {
            current,
            percent: current ? Songs.getPlayedPercents() : 0
        };
    }

    _onChange()
    {
        this.setState( this._getState() );
    }

    componentDidMount()
    {
        interval = setInterval( this._updateTime.bind( this ), 200 );
        Songs.addChangeListener( this._onChange.bind( this ) );
    }

    componentWillUnmount()
    {
        clearInterval( interval );
        Songs.removeChangeListener( this._onChange.bind( this ) );
    }

    getWidth( percent )
    {
        return {
            width: ( percent * 100 ) + '%'
        };
    }

    _updateTime()
    {
        let percent = this.state.current &&
            ( Songs.getPlayingState() || Songs.getPausedState() ) ?
                Songs.getPlayedPercents() : 0;

        if ( percent !== this.state.percent )
        {
            this.setState( { percent } );
        }
    }

    render()
    {
        return this.state.current ?
            <div className='progress'>
                <div className='progress-indicator' style={this.getWidth(this.state.percent)}/>
            </div>
        : null;
    }
}
