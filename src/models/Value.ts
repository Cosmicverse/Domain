/**
 * BSD 3-Clause License
 *
 * Copyright (c) 2022, Daniel Jonathan <daniel at cosmicverse dot com>
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice, this
 *    list of conditions and the following disclaimer.
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
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
 * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
 * OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

/**
 * @module Value
 */

import { string } from 'yup'

import {
  Optional,
  ProxyValidator,
  ProxyVirtual,
  createProxyFor,
} from '@cosmicverse/foundation'

/**
 * Defines the `ValueType` type.
 *
 * @type {string}
 */
export type ValueType = string

/**
 * Defines the `ValuePropertyValue` type.
 *
 * @type {string | number | boolean | Date | Record<string, string | number> | (string | number)[] | Set<string | number> | object}
 */
export type ValuePropertyValue = string | number | boolean | Date | Record<string, string | number> | (string | number)[] | Set<string | number> | object

/**
 * @template TValue
 * @template TValueProperty
 *
 * The `ValueCreateFn` is a type definition that is
 * used to generate new `Value` instances from a
 * given constructor function.
 * @type {(value: TValueProperty) => TValue}
 */
export interface ValueCreateFn<TValue extends Value, TValueProperty extends ValuePropertyValue = ValuePropertyValue> {
  (value: TValueProperty): TValue
}

/**
 * @extends {ProxyValidator}
 *
 * The `ValueValidator` extends the
 * `ProxyValidator`. This is done to organize
 * the definitions within modules better.
 */
export type ValueValidator = ProxyValidator

/**
 * @extends {ProxyVirtual}
 *
 * The `ValueVirtual` extends the
 * `ProxyVirtual`. This is done to organize
 * the definitions within modules better.
 */
export type ValueVirtual = ProxyVirtual

/**
 * The `IValue` defines the base `Value` properties.
 *
 * @property {ValueType} type
 * @property {ValuePropertyValue} value
 */
export interface IValue {
  type: ValueType
  value: ValuePropertyValue
}

/**
 * @implements {IValue}
 *
 * The `Value` class is the base structure used to
 * generate domain values.
 */
export class Value implements IValue {
  /**
   * A reference to the `type` value.
   *
   * @type {ValueType}
   */
  readonly type: ValueType

  /**
   * A reference to the `value` value.
   *
   * @type {ValuePropertyValue}
   */
  readonly value: ValuePropertyValue

  /**
   * This allows for keys to be defined within the
   * `virtual` definition.
   *
   * @type {ValuePropertyValue}
   */
  readonly [key: string]: ValuePropertyValue

  /**
   * @constructor
   *
   * @param {ValueType} type
   * @param {ValuePropertyValue} value
   */
  constructor(type: ValueType, value: ValuePropertyValue) {
    this.type = type
    this.value = value
  }
}

export const ValueTypeErrorMessage = 'Value type is invalid'
export const ValueTypeValidator = string().min(1).typeError(ValueTypeErrorMessage).defined().strict(true)

/**
 * The `createValue` is used to generate a new `Value` instance
 * from a given `type`, 'value', and partial `schema`.
 *
 * @param {ValueType} type
 * @param {ValueValidator} value
 * @param {ValueVirtual} virtual
 * @returns {ValueCreateFn<Value>}
 */
export const createValue = (type: ValueType, value: ValueValidator, virtual?: ValueVirtual): ValueCreateFn<Value> => {
  const schema = {
    immutable: {
      type: ValueTypeValidator,
      value,
    },
    virtual,
  }

  return (value: ValuePropertyValue): Value => createProxyFor(schema, new Value(type, value))
}

/**
 * @template TValue
 * @template TValueProperty
 *
 * The `createValueFor` is used to generate a new `Value` instance
 * from a given `class` constructor, `type`, and partial `schema`.
 *
 * @param {{ new (type: ValueType, value: ValuePropertyValue): TValue }} _class
 * @param {ValueValidator} value
 * @param {ValueVirtual} virtual
 * @returns {ValueCreateFn<TValue>}
 */
export const createValueFor = <TValue extends Value, TValueProperty extends ValuePropertyValue = ValuePropertyValue>(_class: { new (type: ValueType, value: ValuePropertyValue): TValue }, value: ValueValidator, virtual?: ValueVirtual): ValueCreateFn<TValue, TValueProperty> => {
  const schema = {
    immutable: {
      type: ValueTypeValidator,
      value,
    },
    virtual,
  }

  return (value: TValueProperty): TValue => createProxyFor(schema, new _class(_class.name, value))
}

/**
 * The `validateValueFor` is ued to validate a given `Value`.
 *
 * @param {Value} value
 * @param {any} [_class = Value]
 * @param {ValueType} [type = _class.name]
 * @returns {boolean}
 */
export const validateValueFor = (value: Value, _class: Optional<unknown> = Value, type: ValueType = _class.name): boolean => value instanceof _class && type == value.type