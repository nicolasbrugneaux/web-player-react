/*
 * Copyright (c) 2014, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule Dispatcher
 * @typechecks
 */

import invariant from "./invariant";
import { Map } from "immutable";

let _lastID     = 1;
const _prefix   = "ID_";

/**
 * Dispatcher is used to broadcast payloads to registered callbacks. This is
 * different from generic pub-sub systems in two ways:
 *
 *   1) Callbacks are not subscribed to particular events. Every payload is
 *      dispatched to every registered callback.
 *   2) Callbacks can be deferred in whole or part until other callbacks have
 *      been executed.
 *
 * For example, consider this hypothetical flight destination form, which
 * selects a default city when a country is selected:
 *
 *   var flightDispatcher = new Dispatcher();
 *
 *   // Keeps track of which country is selected
 *   var CountryStore = {country: null};
 *
 *   // Keeps track of which city is selected
 *   var CityStore = {city: null};
 *
 *   // Keeps track of the base flight price of the selected city
 *   var FlightPriceStore = {price: null}
 *
 * When a user changes the selected city, we dispatch the payload:
 *
 *   flightDispatcher.dispatch({
 *     actionType: 'city-update',
 *     selectedCity: 'paris'
 *   });
 *
 * This payload is digested by `CityStore`:
 *
 *   flightDispatcher.register(function(payload) {
 *     if (payload.actionType === 'city-update') {
 *       CityStore.city = payload.selectedCity;
 *     }
 *   });
 *
 * When the user selects a country, we dispatch the payload:
 *
 *   flightDispatcher.dispatch({
 *     actionType: 'country-update',
 *     selectedCountry: 'australia'
 *   });
 *
 * This payload is digested by both stores:
 *
 *   CountryStore.dispatchToken = flightDispatcher.register(function(payload) {
 *     if (payload.actionType === 'country-update') {
 *       CountryStore.country = payload.selectedCountry;
 *     }
 *   });
 *
 * When the callback to update `CountryStore` is registered, we save a reference
 * to the returned token. Using this token with `waitFor()`, we can guarantee
 * that `CountryStore` is updated before the callback that updates `CityStore`
 * needs to query its data.
 *
 *   CityStore.dispatchToken = flightDispatcher.register(function(payload) {
 *     if (payload.actionType === 'country-update') {
 *       // `CountryStore.country` may not be updated.
 *       flightDispatcher.waitFor([CountryStore.dispatchToken]);
 *       // `CountryStore.country` is now guaranteed to be updated.
 *
 *       // Select the default city for the new country
 *       CityStore.city = getDefaultCityForCountry(CountryStore.country);
 *     }
 *   });
 *
 * The usage of `waitFor()` can be chained, for example:
 *
 *   FlightPriceStore.dispatchToken =
 *     flightDispatcher.register(function(payload) {
 *       switch (payload.actionType) {
 *         case 'country-update':
 *         case 'city-update':
 *           flightDispatcher.waitFor([CityStore.dispatchToken]);
 *           FlightPriceStore.price =
 *             getFlightPriceStore(CountryStore.country, CityStore.city);
 *           break;
 *     }
 *   });
 *
 * The `country-update` payload will be guaranteed to invoke the stores'
 * registered callbacks in order: `CountryStore`, `CityStore`, then
 * `FlightPriceStore`.
 */

const _callbacks        = Symbol( "callbacks" );
const _isPending        = Symbol( "isPending" );
const _isHandled        = Symbol( "isHandled" );
const _isDispatching    = Symbol( "isDispatching" );
const _pendingPayload   = Symbol( "pendingPayload" );
const _invokeCallback   = Symbol( "invokeCallback" );
const _startDispatching = Symbol( "startDispatching" );
const _stopDispatching  = Symbol( "stopDispatching" );

export default class Dispatcher
{
    constructor()
    {
        this[_callbacks] = new Map();
        this[_isPending] = new Map();
        this[_isHandled] = new Map();
        this[_isDispatching] = false;
        this[_pendingPayload] = null;
    }

    /**
     * Registers a callback to be invoked with every dispatched payload. Returns
     * a token that can be used with `waitFor()`.
     *
     * @param {function} callback
     * @return {string}
     */
    register( callback )
    {
        let id = _prefix + ( _lastID++ );
        this[_callbacks] = this[_callbacks].set( id, callback );
        return id;
    }

    /**
     * Removes a callback based on its token.
     *
     * @param {string} id
     */
    unregister( id )
    {
        invariant(
            this[_callbacks].get( id ),
            "Dispatcher.unregister(...): `%s` does not map to a registered callback.",
            id
        );

        this[_callbacks] = this[_callbacks].delete( id );
    }

    /**
     * Waits for the callbacks specified to be invoked before continuing execution
     * of the current callback. This method should only be used by a callback in
     * response to a dispatched payload.
     *
     * @param {array<string>} ids
     */
    waitFor( ids )
    {
        invariant(
            this[_isDispatching],
            "Dispatcher.waitFor(...): Must be invoked while dispatching."
        );

        ids.forEach( ( id ) =>
        {
            if ( this[_isPending].get( id ) )
            {
                invariant(
                    this[_isHandled].get( id ),
                    "Dispatcher.waitFor(...): Circular dependency detected while " +
                    "waiting for `%s`.",
                    id
                );
                return;
            }

            invariant(
                this[_callbacks].get( id ),
                "Dispatcher.waitFor(...): `%s` does not map to a registered callback.",
                id
            );

            this[_invokeCallback]( id );
        } );
    }

    /**
     * Dispatches a payload to all registered callbacks.
     *
     * @param {object} payload
     */
    dispatch( payload )
    {
        invariant(
            !this[_isDispatching],
            "Dispatch.dispatch(...): Cannot dispatch in the middle of a dispatch."
        );
        this[_startDispatching]( payload );

        try
        {
            this[_callbacks].forEach( ( _, id ) =>
            {
                if ( !this[_isPending].get( id ) )
                {
                    this[_invokeCallback]( id );
                }
            } );
        }
        finally
        {
            this[_stopDispatching]();
        }
    }

    /**
     * Is this Dispatcher currently dispatching.
     *
     * @return {boolean}
     */
    isDispatching()
    {
        return this[_isDispatching];
    }

    /**
     * Call the callback stored with the given id. Also do some internal
     * bookkeeping.
     *
     * @param {string} id
     * @internal
     */
    [_invokeCallback]( id )
    {
        this[_isPending] = this[_isPending].set( id, true );
        this[_callbacks].get( id )( this[_pendingPayload] );
        this[_isHandled] = this[_isHandled].set( id, true );
    }

    /**
     * Set up bookkeeping needed when dispatching.
     *
     * @param {object} payload
     * @internal
     */
    [_startDispatching]( payload )
    {
        this[_callbacks].forEach( ( _, id ) =>
        {
            this[_isPending] = this[_isPending].set( id, false );
            this[_isHandled] = this[_isHandled].set( id, false );
        } );

        this[_pendingPayload] = payload;
        this[_isDispatching] = true;
    }

    /**
     * Clear bookkeeping used for dispatching.
     *
     * @internal
     */
    [_stopDispatching]()
    {
        this[_pendingPayload] = null;
        this[_isDispatching]  = false;
    }
}
