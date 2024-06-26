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
 * @module Entity
 */

import {
  guard,
  FoundationError,
} from '@cosmicmind/foundationjs'

/**
 * Represents an Entity.
 *
 * @example
 * const entity: Entity = {
 *   name: 'John Doe',
 *   age: 25
 * }
 */
export type Entity = Record<string, unknown>

/**
 * Represents a type that is a valid property key of a given entity type.
 *
 * @template K - The entity type.
 * @typeparam K - A type is a valid property key.
 *
 * @returns - A valid property key of the entity type, or `never` if the key is not a valid property key.
 */
export type EntityPropertyKey<K> = keyof K extends string | symbol ? keyof K : never

/**
 * Represents the lifecycle hooks for an entity property.
 *
 * @template E - The type of the entity.
 * @template V - The type of the property value.
 */
export type EntityPropertyLifecycle<E extends Entity, V> = {
  required?: boolean
  validator?(value: V, entity: E): boolean | never
  updated?(newValue: V, oldValue: V, entity: E): void
}

/**
 * Represents a map that defines the lifecycle of entity properties.
 *
 * @template E - The type of the entity.
 */
export type EntityPropertyLifecycleMap<E extends Entity> = {
  [K in keyof E]?: EntityPropertyLifecycle<E, E[K]>
}

export class EntityError extends FoundationError {}

/**
 * Represents the lifecycle methods for an entity.
 *
 * @template E - The type of entity.
 */
export type EntityLifecycle<E extends Entity> = {
  created?(entity: E): void
  trace?(entity: E): void
  error?(error: EntityError): void
  properties?: EntityPropertyLifecycleMap<E>
}

/**
 * Defines an entity with an optional entity lifecycle handler.
 *
 * @template E The type of the entity.
 * @param {EntityLifecycle<E>} [handler={}] The optional entity lifecycle handler.
 * @returns {(entity: E) => E} A function that creates an entity with the given lifecycle handler.
 */
export const defineEntity = <E extends Entity>(handler: EntityLifecycle<E> = {}): (entity: E) => E =>
  (entity: E): E => makeEntity(entity, handler)

/**
 * Creates a ProxyHandler for Entity instances with the given EntityLifecycle handler.
 * The ProxyHandler intercepts property set operations, validates the new value against the associated property validator,
 * triggers the updated callback for the property, updates the property value, and traces the change if trace is enabled.
 *
 * @typeparam E - The type of Entity.
 * @param handler - The EntityLifecycle handler.
 * @returns A ProxyHandler for Entity instances.
 */
function makeEntityHandler<E extends Entity>(handler: EntityLifecycle<E>): ProxyHandler<E> {
  return {
    set<A extends EntityPropertyKey<E>, V extends E[A]>(target: E, key: A, value: V): boolean | never {
      const property = handler.properties?.[key]

      if (false === property?.validator?.(value, target)) {
        throwError(`${JSON.stringify(target)} ${JSON.stringify(key)} is invalid`, handler)
      }

      property?.updated?.(value, target[key], target)

      const result = Reflect.set(target, key, value)
      handler.trace?.(target)

      return result
    },
  }
}

/**
 * Throws an EntityError with a specified message and invokes the error handler.
 *
 * @template E - The type of Entity.
 * @param {string} message - The error message.
 * @param {EntityLifecycle<E>} handler - The entity lifecycle handler.
 * @throws {EntityError} - The EntityError instance.
 * @return {never} - This method never returns.
 */
function throwError<E extends Entity>(message: string, handler: EntityLifecycle<E>): never {
  const error = new EntityError(message)
  handler.error?.(error)
  throw error
}

/**
 * Creates an entity of type `E`.
 *
 * @template E - The type of the entity to create.
 * @param {E} target - The target object to create the entity from.
 * @param {EntityLifecycle<E>} [handler={}] - The lifecycle handler for the entity.
 * @returns {E} - The created entity object.
 * @throws {EntityError} - If the target object is invalid.
 */
function makeEntity<E extends Entity>(target: E, handler: EntityLifecycle<E> = {}): E | never {
  if (guard<E>(target)) {
    const properties = handler.properties

    if (guard<EntityPropertyLifecycleMap<E>>(properties)) {
      const entity = new Proxy(target, makeEntityHandler(handler))

      for (const [ key, property ] of Object.entries(properties) as [string, EntityPropertyLifecycle<E, unknown>][]) {
        if (property.required) {
          if (!(key in target)) {
            throwError(`${JSON.stringify(target)} ${key} is required`, handler)
          }

          if (false === property.validator?.(target[key], entity)) {
            throwError(`${JSON.stringify(target)} ${key} is invalid`, handler)
          }
        }
        else if (key in target && 'undefined' !== typeof target[key]) {
          if (guard(property, 'validator') && false === property.validator?.(target[key], entity)) {
            throwError(`${JSON.stringify(target)} ${key} is invalid`, handler)
          }
        }
      }

      handler.created?.(entity)
      handler.trace?.(entity)

      return entity
    }
  }

  throwError(`${JSON.stringify(target)} is invalid`, handler)
}