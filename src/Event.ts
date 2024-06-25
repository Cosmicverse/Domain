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
 * Represents a type that is a valid property key of a given event type.
 *
 * @template K - The event type.
 * @typeparam K - A type is a valid property key.
 *
 * @returns - A valid property key of the event type, or `never` if the key is not a valid property key.
 */
export type EventPropertyKey<K> = keyof K extends string | symbol ? keyof K : never

/**
 * Represents the lifecycle hooks for an event property.
 *
 * @template E - The type of the event.
 * @template V - The type of the property value.
 */
export type EventPropertyLifecycle<E extends Event, V> = {
  required?: boolean
  validator?(value: V, event: E): boolean | never
  updated?(newValue: V, oldValue: V, event: E): void
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
  trace?(event: E): void
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
  (event: E): E => createEvent(event, handler)

/**
 * Creates a ProxyHandler for Event instances with the given EventLifecycle handler.
 * The ProxyHandler intercepts property set operations, validates the new value against the associated property validator,
 * triggers the updated callback for the property, updates the property value, and traces the change if trace is enabled.
 *
 * @typeparam E - The type of Event.
 * @param handler - The EventLifecycle handler.
 * @returns A ProxyHandler for Event instances.
 */
function createEventHandler<E extends Event>(handler: EventLifecycle<E>): ProxyHandler<E> {
  return {
    set<A extends EventPropertyKey<E>, V extends E[A]>(target: E, key: A, value: V): boolean | never {
      const property = handler.properties?.[key]

      if (false === property?.validator?.(value, target)) {
        throwErrorAndTrace(`${JSON.stringify(target)} ${String(key)} is invalid`, handler)
      }

      property?.updated?.(value, target[key], target)

      const result = Reflect.set(target, key, value)
      handler.trace?.(target)

      return result
    },
  }
}

/**
 * Throws an EventError with a specified event and invokes the error handler.
 *
 * @template E - The type of Event.
 * @param {string} event - The error event.
 * @param {EventLifecycle<E>} handler - The event lifecycle handler.
 * @throws {EventError} - The EventError instance.
 * @return {never} - This method never returns.
 */
function throwErrorAndTrace<E extends Event>(event: string, handler: EventLifecycle<E>): never {
  const error = new EventError(event)
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
function createEvent<E extends Event>(target: E, handler: EventLifecycle<E> = {}): E | never {
  if (guard<E>(target)) {
    const properties = handler.properties

    if (guard<EventPropertyLifecycleMap<E>>(properties)) {
      const event = new Proxy(target, createEventHandler(handler))

      for (const [ key, property ] of Object.entries(properties) as [string, EventPropertyLifecycle<E, unknown>][]) {
        if (property.required) {
          if (!(key in target)) {
            throwErrorAndTrace(`${JSON.stringify(target)} ${key} is required`, handler)
          }

          if (false === property.validator?.(target[key], event)) {
            throwErrorAndTrace(`${JSON.stringify(target)} ${key} is invalid`, handler)
          }
        }
        else if (key in target && 'undefined' !== typeof target[key]) {
          if (guard(property, 'validator') && false === property.validator?.(target[key], event)) {
            throwErrorAndTrace(`${JSON.stringify(target)} ${key} is invalid`, handler)
          }
        }
      }

      handler.created?.(event)
      handler.trace?.(event)

      return event
    }
  }

  throw new EventError(`${String(target)} is invalid`)
}