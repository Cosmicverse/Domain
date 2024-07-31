/**
 * BSD 3-Clause License
 *
 * Copyright © 2023, Daniel Jonathan <daniel at cosmicmind dot com>
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice,
 *    this list of conditions and the following disclaimer.
 *
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the documentation
 *    and/or other materials provided with the distribution.
 *
 * 3. Neither the name of the copyright holder nor the names of its
 *    contributors may be used to endorse or promote products derived from
 *    this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
 * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES LOSS OF USE, DATA, OR PROFITS OR BUSINESS INTERRUPTION) HOWEVER
 * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
 * OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

/**
 * @module Event
 */

import {
  guard,
  FoundationError,
} from '@cosmicmind/foundationjs'

import {
  Observable,
  ObservableTopics,
} from '@/Topic'

/**
 * Represents an event.
 *
 * @typedef {Record<string, unknown>} Event
 */
export type Event = Record<string, unknown>

/**
 * Represents a collection of event topics.
 *
 * @typedef {Object} EventTopics
 * @extends ObservableTopics
 *
 * An EventTopics object is an extension of the ObservableTopics interface,
 * which defines a collection of event topics. Each topic is accessible as
 * a property of the EventTopics object, using the topic name as the property
 * key. The value of each property is an Event object, representing the specific
 * event topic.
 *
 * @property {Event} topicName - The event object representing the specific topic.
 * @readonly
 */
export type EventTopics = ObservableTopics & {
  readonly [K: string]: Event
}

/**
 * Represents an observable for events.
 *
 * @typeparam T - The type of event topics.
 */
export class EventObservable<T extends EventTopics> extends Observable<T> {}

/**
 * Represents the lifecycle configuration for an event property.
 *
 * @template E - The type of event this property belongs to.
 * @template V - The type of value this property takes.
 */
export type EventPropertyLifecycle<E extends Event, V> = {
  required?: boolean
  validator?(value: V, event: E): boolean | never
}

/**
 * Represents a map of event properties and their associated lifecycles.
 * @template E - The type of event.
 */
export type EventPropertyLifecycleMap<E extends Event> = {
  [K in keyof E]?: EventPropertyLifecycle<E, E[K]>
}

/**
 * Custom error class for event-related errors.
 *
 * @class EventError
 * @extends FoundationError
 */
export class EventError extends FoundationError {}

/**
 * Represents the lifecycle of an event.
 *
 * @template E - The type of the event.
 */
export type EventLifecycle<E extends Event> = {
  created?(event: E): void
  error?(error: EventError): void
  properties?: EventPropertyLifecycleMap<E>
}

/**
 * Defines an event handler function.
 *
 * @param {EventLifecycle<E>} [handler={}] - The event lifecycle handler object.
 * @returns {(event: E) => E} - The event handler function.
 * @template E - The type of event.
 */
export const defineEvent = <E extends Event>(handler: EventLifecycle<E> = {}): (event: E) => E =>
  (event: E): E => makeEvent(event, handler)

/**
 * Creates a proxy handler for event objects that disallows modification of event properties.
 *
 * @template E - The type of the event object.
 * @param {EventLifecycle<E>} handler - The event lifecycle handler.
 * @returns {ProxyHandler<E>} - The proxy handler for the event object.
 */
function makeEventHandler<E extends Event>(handler: EventLifecycle<E>): ProxyHandler<E> {
  return {
    set(): never {
      throwError('cannot modify event properties', handler)
    },
  }
}

/**
 * Throws an EventError and invokes the error handler.
 * @template E - The type of event.
 * @param {string} event - The event name.
 * @param {EventLifecycle<E>} handler - The event handler.
 * @throws {EventError} - The error that is thrown.
 * @returns {never} - This method never returns as it always throws an error.
 */
function throwError<E extends Event>(event: string, handler: EventLifecycle<E>): never {
  const error = new EventError(event)
  handler.error?.(error)
  throw error
}

/**
 * Creates a new event object and applies lifecycle handlers and validators to its properties.
 *
 * @template E - The type of the event object.
 * @param {E} target - The target event object.
 * @param {EventLifecycle<E>} [handler={}] - An optional object containing lifecycle handlers and validators.
 * @throws {EventError} - Throws an error if the target event object is invalid.
 * @returns {E | never} - The created event object with applied lifecycle handlers and validators.
 */
function makeEvent<E extends Event>(target: E, handler: EventLifecycle<E> = {}): E | never {
  if (guard<E>(target)) {
    const properties = handler.properties

    if (guard<EventPropertyLifecycleMap<E>>(properties)) {
      const event = new Proxy(target, makeEventHandler(handler))

      for (const [ key, property ] of Object.entries(properties) as [string, EventPropertyLifecycle<E, unknown>][]) {
        if (property.required) {
          if (!(key in target)) {
            throwError(`${JSON.stringify(target)} ${key} is required`, handler)
          }

          if (false === property.validator?.(target[key], event)) {
            throwError(`${JSON.stringify(target)} ${key} is invalid`, handler)
          }
        }
        else if (key in target && 'undefined' !== typeof target[key]) {
          if (guard(property, 'validator') && false === property.validator?.(target[key], event)) {
            throwError(`${JSON.stringify(target)} ${key} is invalid`, handler)
          }
        }
      }

      handler.created?.(event)

      return event
    }
  }

  throw new EventError(`${String(target)} is invalid`)
}