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
 * @module Message
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
 * Represents an Message.
 *
 * @example
 * const message: Message = {
 *   name: 'John Doe',
 *   age: 25
 * }
 */
export type Message = Record<string, unknown>

/**
 * Represents a collection of message topics.
 *
 * @extends {ObservableTopics}
 *
 * @property {Message} [K] - The message topic.
 */
export type MessageTopics = ObservableTopics & {
  readonly [K: string]: Message
}

/**
 * An observable class for handling messages of specific types.
 *
 * @template T The message topic type.
 */
export class MessageObservable<T extends MessageTopics> extends Observable<T> {}

/**
 * Represents the lifecycle hooks for an message property.
 *
 * @template E - The type of the message.
 * @template V - The type of the property value.
 */
export type MessagePropertyLifecycle<E extends Message, V> = {
  required?: boolean
  validator?(value: V, message: E): boolean | never
}

/**
 * Represents a map that defines the lifecycle of message properties.
 *
 * @template E - The type of the message.
 */
export type MessagePropertyLifecycleMap<E extends Message> = {
  [K in keyof E]?: MessagePropertyLifecycle<E, E[K]>
}

export class MessageError extends FoundationError {}

/**
 * Represents the lifecycle methods for an message.
 *
 * @template E - The type of message.
 */
export type MessageLifecycle<E extends Message> = {
  created?(message: E): void
  error?(error: MessageError): void
  properties?: MessagePropertyLifecycleMap<E>
}

/**
 * Defines an message with an optional message lifecycle handler.
 *
 * @template E The type of the message.
 * @param {MessageLifecycle<E>} [handler={}] The optional message lifecycle handler.
 * @returns {(message: E) => E} A function that creates an message with the given lifecycle handler.
 */
export const defineMessage = <E extends Message>(handler: MessageLifecycle<E> = {}): (message: E) => E =>
  (message: E): E => makeMessage(message, handler)

/**
 * Creates a proxy message handler that prmessages the modification of message properties.
 *
 * @template E - The message type.
 * @param {MessageLifecycle<E>} handler - The message lifecycle handler.
 * @returns {ProxyHandler<E>} - The proxy message handler.
 */
function makeMessageHandler<E extends Message>(handler: MessageLifecycle<E>): ProxyHandler<E> {
  return {
    set(): never {
      throwError('cannot modify message properties', handler)
    },
  }
}

/**
 * Throws an MessageError with a specified message and invokes the error handler.
 *
 * @template E - The type of Message.
 * @param {string} message - The error message.
 * @param {MessageLifecycle<E>} handler - The message lifecycle handler.
 * @throws {MessageError} - The MessageError instance.
 * @return {never} - This method never returns.
 */
function throwError<E extends Message>(message: string, handler: MessageLifecycle<E>): never {
  const error = new MessageError(message)
  handler.error?.(error)
  throw error
}

/**
 * Creates an message of type `E`.
 *
 * @template E - The type of the message to create.
 * @param {E} target - The target object to create the message from.
 * @param {MessageLifecycle<E>} [handler={}] - The lifecycle handler for the message.
 * @returns {E} - The created message object.
 * @throws {MessageError} - If the target object is invalid.
 */
function makeMessage<E extends Message>(target: E, handler: MessageLifecycle<E> = {}): E | never {
  if (guard<E>(target)) {
    const properties = handler.properties

    if (guard<MessagePropertyLifecycleMap<E>>(properties)) {
      const message = new Proxy(target, makeMessageHandler(handler))

      for (const [ key, property ] of Object.entries(properties) as [string, MessagePropertyLifecycle<E, unknown>][]) {
        if (property.required) {
          if (!(key in target)) {
            throwError(`${JSON.stringify(target)} ${key} is required`, handler)
          }

          if (false === property.validator?.(target[key], message)) {
            throwError(`${JSON.stringify(target)} ${key} is invalid`, handler)
          }
        }
        else if (key in target && 'undefined' !== typeof target[key]) {
          if (guard(property, 'validator') && false === property.validator?.(target[key], message)) {
            throwError(`${JSON.stringify(target)} ${key} is invalid`, handler)
          }
        }
      }

      handler.created?.(message)

      return message
    }
  }

  throw new MessageError(`${String(target)} is invalid`)
}