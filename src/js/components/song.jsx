import React from 'react';
import cx from 'classnames';
import actions from '../actions/';

const defaultImg = 'dist/img/default.png';

export default class Song extends React.Component
{
    /* jshint ignore:start */
    static propTypes =
    {
        active: React.PropTypes.bool.isRequired,
        song: React.PropTypes.object.isRequired
    }
    /* jshint ignore:end */

    _remove()
    {
        actions.removeSong( this.props.id );
    }

    _select()
    {
        actions.select( this.props.id );
    }

    render()
    {
        /* jshint ignore:start */
        return (
            <div className={cx({
                active: this.props.active,
                track: true
            })}>
                <div onClick={this._select.bind( this )}>
                    <span className='overlay'>
                        <i className="fa fa-play"/>
                    </span>
                    <img src={this.props.song.picture || defaultImg}/>
                </div>
                <div onClick={this._select.bind( this )}>
                    <div className='title'>{this.props.song.title}</div>
                    <div className='artist'>{this.props.song.artist}</div>
                </div>
                <i className='remove-track fa fa-close' onClick={this._remove.bind( this )} />
            </div>
        );
        /* jshint ignore:end */
    }
}
