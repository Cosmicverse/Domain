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
 * @module Value
 */

import {
  guard,
  FoundationError,
} from '@cosmicmind/foundationjs'

/**
 * Represents a value of generic type.
 *
 * @typeparam V - The type of the value.
 */
export abstract class Value<V> {
  /**
   * Represents the value of a variable.
   *
   * @description The type can be any valid JavaScript data type.
   */
  private readonly _value: V

  /**
   * Retrieves the value stored in the instance of the class.
   *
   * @returns {V} The value stored in the instance.
   */
  get value(): V {
    return this._value
  }

  /**
   * Creates a new instance of the constructor.
   *
   * @template V - The type of the value to create.
   * @param {V} value - The initial value for the instance.
   */
  constructor(value: V) {
    this._value = 'function' === typeof this.prepare ? this.prepare(value) : value
  }

  protected prepare?(value: V): V
}

/**
 * Represents the value type for a given generic type parameter.
 *
 * @template V - The generic type parameter.
 */
export type ValueTypeFor<V> = V extends Value<infer T> ? T : V

/**
 * Represents a class that constructs a value of a specific type.
 *
 * @template V - The type of value constructed by the class.
 */
export type ValueConstructor<V extends Value<unknown>> = new (value: ValueTypeFor<V>) => V

/**
 * Represents a value error, which is a type of FoundationError.
 *
 * @extends {FoundationError}
 */
export class ValueError extends FoundationError {}

/**
 * Represents the lifecycle callbacks for a value.
 *
 * @template V - The type of the value.
 */
export type ValueLifecycle<V> = {
  created?(vo: V): void
  trace?(vo: V): void
  validator?(value: ValueTypeFor<V>, vo: V): boolean | never
  error?(error: ValueError): void
}

/**
 * Defines a value of type V.
 *
 * @template V - The type of value to define.
 * @param {ValueConstructor<V>} _class - The constructor function for creating the value object.
 * @param {ValueLifecycle<V>} [handler={}] - Optional handler object for lifecycle hooks.
 * @returns {function(value: ValueTypeFor<V>): V} - A function that creates and returns the defined value.
 */
export const defineValue = <V extends Value<ValueTypeFor<V>>>(_class: ValueConstructor<V>, handler: ValueLifecycle<V> = {}): (value: ValueTypeFor<V>) => V =>
  (value: ValueTypeFor<V>): V => createValue(new _class(value), value, handler)

/**
 * Creates a proxy handler that defines behavior for setting a value.
 *
 * @template V - The type of the value.
 * @template T - The type of the value's key.
 * @param {ValueLifecycle<V>} handler - The value's lifecycle handler.
 * @returns {ProxyHandler<V>} - The proxy handler object.
 * @throws {ValueError} - If the value is invalid.
 */
function createValueHandler<V extends Value<ValueTypeFor<V>>, T extends ValueTypeFor<V> = ValueTypeFor<V>>(handler: ValueLifecycle<V>): ProxyHandler<V> {
  return {
    set(target: V, key: 'value', value: T): boolean | never {
      if (false === handler.validator?.(value, target)) {
        throw new ValueError(`${String(key)} is invalid`)
      }
      return Reflect.set(target, key, value)
    },
  }
}

/**
 * Throws an error with the given message and invokes the error
 * handler's error method if available. This method does not return
 * and always throws an error.
 *
 * @param {string} message - The error message.
 * @param {ValueLifecycle<V>} handler - The error handler.
 * @throws {ValueError} - The thrown error object.
 */
function throwErrorAndTrace<V extends Value<ValueTypeFor<V>>>(message: string, handler: ValueLifecycle<V>): never {
  const error = new ValueError(message)
  handler.error?.(error)
  throw error
}

/**
 * Creates a new instance of the provided Value class with the given value, using the specified ValueLifecycle handler.
 *
 * @template V - The type of the Value instance to be created.
 * @param {V} target - The target Value instance to create.
 * @param {ValueTypeFor<V>} value - The initial value for the created Value instance.
 * @param {ValueLifecycle<V>} [handler={}] - The ValueLifecycle handler object.
 * @returns {V | never} - The created Value instance or throws an error if creation is unsuccessful.
 * @throws {Error} - Throws an error if unable to create the value.
 */
function createValue<V extends Value<ValueTypeFor<V>>>(target: V, value: ValueTypeFor<V>, handler: ValueLifecycle<V> = {}): V | never {
  if (guard<V>(target)) {
    const vo = new Proxy(target, createValueHandler(handler))

    if (false === handler.validator?.(value, vo)) {
      throwErrorAndTrace(`${JSON.stringify(target)} is invalid: ${JSON.stringify(value)}`, handler)
    }

    handler.created?.(vo)
    handler.trace?.(vo)

    return vo
  }

  throwErrorAndTrace(`${JSON.stringify(target)} is invalid`, handler)
}