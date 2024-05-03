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

import {
  it,
  expect,
  describe,
} from 'vitest'

import {
  string,
} from 'yup'

import {
  uuidv4,
  guard,
} from '@cosmicmind/foundationjs'

import {
  Entity,
  Aggregate,
  defineAggregate,
  Event,
  EventTopics,
  defineEvent,
  Value,
  defineValue,
} from '@/index'

class Email extends Value<string> {
  get domainAddress(): string {
    return this.value.split('@')[1]
  }
}

const makeEmail = defineValue(Email, {
  validator: (value: string): boolean => 'string' === typeof string().email('email is invalid').strict(true).validateSync(value),
})

interface User extends Entity {
  readonly id: string
  readonly createdAt: Date
  name: string
  version: number
  email: Email
}

type UserRegisterEvent = Event & {
  entity: User
}

const makeUserAggregateRegisterEvent = defineEvent<UserRegisterEvent>({
  properties: {
    entity: {
      validator: (entity: User): boolean => guard<User>(entity),
    },
  },
})

type UserTopics = EventTopics & {
  'register-user-account-sync': UserRegisterEvent
  'register-user-account': UserRegisterEvent
}

class UserAggregate extends Aggregate<User, UserTopics> {
  get id(): string {
    return this.root.id
  }

  get createdAt(): Date {
    return this.root.createdAt
  }

  get name(): string {
    return this.root.name
  }

  get version(): number {
    return this.root.version
  }

  get user(): User {
    return this.root
  }

  updateName(): void {
    this.root.name = 'jonathan'
  }

  registerAccountSync(): void {
    this.publishSync('register-user-account-sync', makeUserAggregateRegisterEvent({
      entity: this.root,
    }))
  }

  registerAccount(): void {
    this.publish('register-user-account', makeUserAggregateRegisterEvent({
      entity: this.root,
    }))
  }
}

describe('Aggregate', () => {
  it('makeAggregate', () => {
    const id = uuidv4()
    const createdAt = new Date()
    const name = 'daniel'
    const version = 1
    const email = 'susan@domain.com'

    const makeAggregate = defineAggregate(UserAggregate, {
      trace(entity: User) {
        expect(guard<User>(entity)).toBeTruthy()
      },

      created(entity: User) {
        expect(guard<User>(entity)).toBeTruthy()
      },

      properties: {
        id: {
          validator(value: string) {
            expect(value).toBe(id)
            return 2 < value.length
          },
        },

        createdAt: {
          validator(value: Date) {
            expect(value).toBe(createdAt)
            return guard<Date>(value)
          },
        },

        name: {
          validator(value: string) {
            expect(2 < value.length).toBeTruthy()
            return 2 < value.length
          },

          updated: (newValue: string, oldValue: string, entity: User): void => {
            expect(newValue).toBe('jonathan')
            expect(oldValue).toBe(name)
            expect(entity.id).toBe(id)
            expect(entity.createdAt).toBe(createdAt)
            expect(entity.name).toBe(name)
          },
        },

        version: {
          validator(value: number) {
            expect(0 < value).toBeTruthy()
            return 0 < value
          },
        },

        email: {
          validator(value: Email, entity: User) {
            expect(email).toBe(value.value)
            expect(email).toBe(entity.email.value)
            return email === value.value
          },
        },
      },
    })

    const a1 = makeAggregate({
      id,
      createdAt,
      name,
      version,
      email: makeEmail(email),
    })

    a1.subscribe('register-user-account-sync', (event: UserRegisterEvent) => {
      expect(event.entity).toStrictEqual(a1.user)
    })

    a1.subscribe('register-user-account', (event: UserRegisterEvent) => {
      expect(event.entity).toStrictEqual(a1.user)
    })

    a1.updateName()

    a1.registerAccountSync()
    a1.registerAccount()

    expect(a1.id).toBe(id)
    expect(a1.createdAt).toBe(createdAt)
    expect(a1.name).toBe('jonathan')
    expect(a1.version).toBe(version)
  })
})