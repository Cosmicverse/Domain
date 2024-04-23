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

import {
  ValueError,
} from '@/Value'

export type Entity = object

/**
 * The `EntityAttributeKey` defines the allowable keys for
 * a given type `K`.
 */
export type EntityAttributeKey<K> = keyof K extends string | symbol ? keyof K : never

export type EntityAttributeLifecycle<E extends Entity, V> = {
  required?: boolean
  validator?(value: V, entity: E): boolean | never
  updated?(newValue: V, oldValue: V, entity: E): void
}

/**
 * The `EntityAttributeLifecycleMap` defined the key-value
 * pairs used in handling attribute events.
 */
export type EntityAttributeLifecycleMap<E extends Entity> = {
  [K in keyof E]?: EntityAttributeLifecycle<E, E[K]>
}

export class EntityError extends FoundationError {}

export type EntityLifecycle<E extends Entity> = {
  created?(entity: E): void
  trace?(entity: E): void
  error?(error: ValueError): void
  attributes?: EntityAttributeLifecycleMap<E>
}

export const defineEntity = <E extends Entity>(handler: EntityLifecycle<E> = {}): (entity: E) => E =>
  (entity: E): E => createEntity(entity, handler)

/**
 * The `createEntityHandler` prepares the `EntityLifecycle` for
 * the given `handler`.
 */
function createEntityHandler<E extends Entity>(handler: EntityLifecycle<E>): ProxyHandler<E> {
  return {
    set<A extends EntityAttributeKey<E>, V extends E[A]>(target: E, attr: A, value: V): boolean | never {
      const h = handler.attributes?.[attr]
      if (false === h?.validator?.(value, target)) {
        throw new ValueError(`${String(attr)} is invalid`)
      }

      h?.updated?.(value, target[attr], target)

      const result = Reflect.set(target, attr, value)
      handler.trace?.(target)
      return result
    },
  }
}

/**
 * The `createEntity` creates a new `Proxy` instance with the
 * given `target` and `handler`.
 */
function createEntity<E extends Entity>(target: E, handler: EntityLifecycle<E> = {}): E | never {
  if (guard<E>(target)) {
    try {
      const attributes = handler.attributes

      if (guard<EntityAttributeLifecycleMap<E>>(attributes)) {
        const entity = new Proxy(target, createEntityHandler(handler))

        for (const key in attributes) {
          const property = attributes[key] as unknown
          if (guard(property, 'required') && property.required) {
            if (!(key in target)) {
              throw new ValueError(`${JSON.stringify(target)} ${key} is required`)
            }

            if (guard(property, 'validator') && false === property.validator?.(target[key], entity)) {
              throw new ValueError(`${JSON.stringify(target)} ${key} is invalid`)
            }
          }
          else if (key in target && 'undefined' !== typeof target[key]) {
            if (guard(property, 'validator') && false === property.validator?.(target[key], entity)) {
              throw new ValueError(`${JSON.stringify(target)} ${key} is invalid`)
            }
          }
        }

        handler.created?.(entity)
        handler.trace?.(entity)

        return entity
      }
    }
    catch (error) {
      handler.error?.(error as Error)

      throw error
    }
  }

  throw new EntityError(`${String(target)} is invalid`)
}