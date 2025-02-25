/**
 * BSD 3-Clause License
 *
 * Copyright © 2025, CosmicMind, Inc.
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
} from '@/Topic'

/**
 * Represents a generic message.
 */
export type Message = Record<string, unknown>

/**
 * Represents a collection of message topics.
 *
 * @typedef {Object} MessageTopics
 * @extends ObservableTopics
 * @property {Message} [K] - The topic name mapped to its corresponding message.
 */
export type MessageTopics = ObservableTopics & {
  readonly [K: string]: Message
}

/**
 * Represents an Observable that emits messages of a specific topic.
 *
 * @template T - The type of the message topic.
 */
export class MessageObservable<T extends MessageTopics> extends Observable<T> {}

/**
 * Type definition for the lifecycle of a message property.
 *
 * @template E - The type of the message.
 * @template V - The type of the property value.
 */
export type MessagePropertyLifecycle<E extends Message, V> = {
  required?: boolean
  validator?(value: V, message: E): boolean | never
}

/**
 * Represents a map of property lifecycles for a message class.
 *
 * @template E - The message class type.
 */
export type MessagePropertyLifecycleMap<E extends Message> = {
  [K in keyof E]?: MessagePropertyLifecycle<E, E[K]>
}

/**
 * Error class for message-related errors.
 *
 * @extends {FoundationError}
 */
export class MessageError extends FoundationError {}

/**
 * Represents the lifecycle events for a message.
 * @template E The type of the message.
 */
export type MessageLifecycle<E extends Message> = {
  created?(message: E): void
  error?(error: MessageError): void
  properties?: MessagePropertyLifecycleMap<E>
}

/**
 * Define message function.
 * @template E - Type of the message.
 * @param {MessageLifecycle<E>} [handler={}] - Message lifecycle handler.
 * @returns {(message: E) => E} - A function that creates and processes the message.
 */
export const defineMessage = <E extends Message>(handler: MessageLifecycle<E> = {}): (message: E) => E =>
    (message: E): E => makeMessage(message, handler)

/**
 * Creates a proxy handler to be used as a message handler.
 *
 * @template E - The type of the message object.
 * @param {MessageLifecycle<E>} handler - The message lifecycle handler.
 * @returns {ProxyHandler<E>} - The proxy handler for the message.
 */
function makeMessageHandler<E extends Message>(handler: MessageLifecycle<E>): ProxyHandler<E> {
    return {
        set(): never {
            throwError('cannot modify message properties', handler)
        },
    }
}

/**
 * Throws an error with the provided message and calls the error handler.
 * This method does not return normally.
 *
 * @template E - The type of the message.
 * @param {string} message - The error message.
 * @param {MessageLifecycle<E>} handler - The error handler to call.
 * @throws {MessageError} - The thrown error.
 */
function throwError<E extends Message>(message: string, handler: MessageLifecycle<E>): never {
    const error = new MessageError(message)
    handler.error?.(error)
    throw error
}

/**
 * Creates a message object and applies lifecycle methods and validations.
 *
 * @template E - Type of the message object.
 * @param {E} target - The message object to be created.
 * @param {MessageLifecycle<E>} handler - The lifecycle methods and validators for the message object. (Optional)
 * @returns {E | never} - The created message object.
 * @throws {MessageError} - If the target is invalid.
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