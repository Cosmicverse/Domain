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
} from '@cosmicmind/patternjs'

/**
 * Represents an Event.
 *
 * @example
 * const event: Event = {
 *   name: 'John Doe',
 *   age: 25
 * }
 */
export type Event = Record<string, unknown>

/**
 * Represents a collection of event topics.
 *
 * @extends {ObservableTopics}
 *
 * @property {Event} [K] - The event topic.
 */
export type EventTopics = ObservableTopics & {
  readonly [K: string]: Event
}

/**
 * An observable class for handling events of specific types.
 *
 * @template T The event topic type.
 */
export class EventObservable<T extends EventTopics> extends Observable<T> {}

/**
 * Represents the lifecycle hooks for an event property.
 *
 * @template E - The type of the event.
 * @template V - The type of the property value.
 */
export type EventPropertyLifecycle<E extends Event, V> = {
  required?: boolean
  validator?(value: V, event: E): boolean | never
}

/**
 * Represents a map that defines the lifecycle of event properties.
 *
 * @template E - The type of the event.
 */
export type EventPropertyLifecycleMap<E extends Event> = {
  [K in keyof E]?: EventPropertyLifecycle<E, E[K]>
}

export class EventError extends FoundationError {}

/**
 * Represents the lifecycle methods for an event.
 *
 * @template E - The type of event.
 */
export type EventLifecycle<E extends Event> = {
  created?(event: E): void
  error?(error: EventError): void
  properties?: EventPropertyLifecycleMap<E>
}

/**
 * Defines an event with an optional event lifecycle handler.
 *
 * @template E The type of the event.
 * @param {EventLifecycle<E>} [handler={}] The optional event lifecycle handler.
 * @returns {(event: E) => E} A function that creates an event with the given lifecycle handler.
 */
export const defineEvent = <E extends Event>(handler: EventLifecycle<E> = {}): (event: E) => E =>
  (event: E): E => makeEvent(event, handler)

/**
 * Creates a proxy event handler that prevents the modification of event properties.
 *
 * @template E - The event type.
 * @param {EventLifecycle<E>} handler - The event lifecycle handler.
 * @returns {ProxyHandler<E>} - The proxy event handler.
 */
function makeEventHandler<E extends Event>(handler: EventLifecycle<E>): ProxyHandler<E> {
  return {
    set(): never {
      throwError('cannot modify event properties', handler)
    },
  }
}

/**
 * Throws an EventError with a specified event and invokes the error handler.
 *
 * @template E - The type of Event.
 * @param {string} message - The error message.
 * @param {EventLifecycle<E>} handler - The event lifecycle handler.
 * @throws {EventError} - The EventError instance.
 * @return {never} - This method never returns.
 */
function throwError<E extends Event>(message: string, handler: EventLifecycle<E>): never {
  const error = new EventError(message)
  handler.error?.(error)
  throw error
}

/**
 * Creates an event of type `E`.
 *
 * @template E - The type of the event to create.
 * @param {E} target - The target object to create the event from.
 * @param {EventLifecycle<E>} [handler={}] - The lifecycle handler for the event.
 * @returns {E} - The created event object.
 * @throws {EventError} - If the target object is invalid.
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