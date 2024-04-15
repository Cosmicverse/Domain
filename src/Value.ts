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

export abstract class Value<V> {
  private readonly _value: V

  get value(): V {
    return this._value
  }

  constructor(value: V) {
    this._value = 'function' === typeof this.prepare ? this.prepare(value) : value
  }

  protected prepare?(value: V): V
}

/**
 * Infers the given type `T` for `Value<T>`.
 */
export type ValueTypeFor<V> = V extends Value<infer T> ? T : V

/**
 * The constructor that the `defineValue` is willing to accept
 * as an implemented `Value<T>`.
 */
export type ValueConstructor<V extends Value<unknown>> = new (value: ValueTypeFor<V>) => V

export class ValueError extends FoundationError {}

export type ValueLifecycle<V> = {
  created?(vo: V): void
  trace?(vo: V): void
  validator?(value: ValueTypeFor<V>, vo: V): boolean | never
  error?(error: ValueError): void
}

/**
 * The `defineValue` sets a new ValueLifecycle to the given `Value`.
 */
export const defineValue = <V extends Value<ValueTypeFor<V>>>(_class: ValueConstructor<V>, handler: ValueLifecycle<V> = {}): (value: ValueTypeFor<V>) => V =>
  (value: ValueTypeFor<V>): V => createValue(new _class(value), value, handler)

/**
 * The `createValueHandler` prepares the `ValueLifecycle` for
 * the given `handler`.
 */
function createValueHandler<V extends Value<ValueTypeFor<V>>, T extends ValueTypeFor<V> = ValueTypeFor<V>>(handler: ValueLifecycle<V>): ProxyHandler<V> {
  return {
    set(target: V, attr: 'value', value: T): boolean | never {
      if (false === handler.validator?.(value, target)) {
        throw new ValueError(`${String(attr)} is invalid`)
      }
      return Reflect.set(target, attr, value)
    },
  }
}

/**
 * The `createValue` creates a new `Proxy` instance with the
 * given `target` and `handler`.
 */
function createValue<V extends Value<ValueTypeFor<V>>>(target: V, value: ValueTypeFor<V>, handler: ValueLifecycle<V> = {}): V | never {
  if (guard<V>(target)) {
    try {
      const vo = new Proxy(target, createValueHandler(handler))

      if (false === handler.validator?.(value, vo)) {
        throw new ValueError(`${JSON.stringify(value)} is invalid`)
      }

      handler.created?.(vo)
      handler.trace?.(vo)

      return vo
    }
    catch (error) {
      if (error instanceof ValueError) {
        handler.error?.(error)
      }

      throw error
    }
  }

  throw new ValueError('unable to create value')
}