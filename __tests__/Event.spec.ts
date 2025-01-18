/**
 * BSD 3-Clause License
 *
 * Copyright © 2024, Daniel Jonathan <daniel at cosmicmind dot com>
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
    guard,
} from '@cosmicmind/foundationjs'
import {
    it,
    expect,
    expectTypeOf,
    describe,
} from 'vitest'


import {
    Event,
    EventError,
    defineEvent,
} from '@/index'

type User = Event & {
  readonly id: string
  readonly createdAt: Date
  name: string
  empty?: string
}

const makeUser = defineEvent<User>({
    properties: {
        id: {
            required: true,
            validator: value => 2 < value.length,
        },

        createdAt: {
            required: true,
            validator: value => guard(value),
        },

        name: {
            required: true,
            validator: value => 2 < value.length,
        },

        empty: {
            required: false,
            validator: value => guard(value),
        },
    },
})

describe('Event', () => {
    it('interface', () => {
        const id = '123'
        const createdAt = new Date()
        const name = 'daniel'

        const e1 = makeUser({
            id,
            createdAt,
            name,
        })

        expect(e1.id).toBe(id)
        expect(e1.createdAt).toBe(createdAt)
        expect(e1.name).toBe(name)
    })

    it('immutable properties', () => {
        const id = '123'
        const createdAt = new Date()
        const name = 'daniel'

        const e1 = makeUser({
            id,
            createdAt,
            name,
        })

        try {
            e1.name = ''
            expect(true).toBeFalsy()
        }
        catch (error) {
            if (error instanceof EventError) {
                expect(error.name).toBe('EventError')
                expectTypeOf(error.message).toMatchTypeOf<string>()
            }
            else {
                expect(true).toBeFalsy()
            }
        }

        expect(e1.id).toBe(id)
        expect(e1.createdAt).toBe(createdAt)
        expect(name).toBe(e1.name)
    })

    it('undefined properties', () => {
        const id = '123'
        const createdAt = new Date()
        const name = 'daniel'
        const empty = undefined

        const e1 = makeUser({
            id,
            createdAt,
            name,
            empty,
        })

        expect(e1.id).toBe(id)
        expect(e1.createdAt).toBe(createdAt)
        expect(name).toBe(e1.name)
        expect(empty).toBe(undefined)
    })

    it('EventLifecycle', () => {
        const id = '123'
        const createdAt = new Date()
        const name = 'daniel'

        const createEvent = defineEvent<User>({
            created(event) {
                expect(guard(event))
            },

            properties: {
                id: {
                    required: true,
                    validator: (value, event) => {
                        expect(value).toBe(id)
                        expect(event.id).toBe(id)
                        return 2 < value.length
                    },
                },

                createdAt: {
                    required: true,
                    validator: (value, event) => {
                        expect(value).toBe(createdAt)
                        expect(event.createdAt).toBe(createdAt)
                        return guard(value)
                    },
                },

                name: {
                    required: true,
                    validator: (value, event) => {
                        expect(2 < value.length).toBeTruthy()
                        expect(2 < event.name.length).toBeTruthy()
                        return 2 < value.length
                    },
                },
            },
        })

        const e1 = createEvent({
            id,
            createdAt,
            name,
        })

        expect(e1.id).toBe(id)
        expect(e1.createdAt).toBe(createdAt)
        expect(e1.name).toBe(e1.name)
    })
})