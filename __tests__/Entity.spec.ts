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
    Entity,
    EntityError,
    defineEntity,
} from '@/index'

type User = Entity & {
  readonly id: string
  readonly createdAt: Date
  name: string
  empty?: string
}

const makeUser = defineEntity<User>({
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

describe('Entity', () => {
    it('interface', () => {
        const id = '123'
        const createdAt = new Date()
        const name = 'daniel'

        const e1 = makeUser({
            id,
            createdAt,
            name: 'jonathan',
        })

        e1.name = 'daniel'

        expect(e1.id).toBe(id)
        expect(e1.createdAt).toBe(createdAt)
        expect(e1.name).toBe(name)
    })

    it('partial validator', () => {
        const id = '123'
        const createdAt = new Date()
        const name = 'daniel'

        const e1 = makeUser({
            id,
            createdAt,
            name: 'jonathan',
        })

        try {
            e1.name = ''
            expect(true).toBeFalsy()
        }
        catch (error) {
            if (error instanceof EntityError) {
                expect(error.name).toBe('EntityError')
                expectTypeOf(error.message).toMatchTypeOf<string>()
            }
            else {
                expect(true).toBeFalsy()
            }
        }

        expect(e1.id).toBe(id)
        expect(e1.createdAt).toBe(createdAt)
        expect(name).not.toBe(e1.name)
    })

    it('partial validator 2', () => {
        const id = '123'
        const createdAt = new Date()
        const name = 'daniel'
        const empty = 'yay'

        const e1 = makeUser({
            id,
            createdAt,
            name: 'jonathan',
            empty,
        })

        try {
            e1.name = ''
            expect(true).toBeFalsy()
        }
        catch (error) {
            if (error instanceof EntityError) {
                expect(error.name).toBe('EntityError')
                expectTypeOf(error.message).toMatchTypeOf<string>()
            }
            else {
                expect(true).toBeFalsy()
            }
        }

        expect(e1.id).toBe(id)
        expect(e1.createdAt).toBe(createdAt)
        expect(name).not.toBe(e1.name)
        expect(empty).toBe(e1.empty)
    })

    it('partial validator 3', () => {
        const id = '123'
        const createdAt = new Date()
        const name = 'daniel'
        const empty = undefined

        const e1 = makeUser({
            id,
            createdAt,
            name: 'jonathan',
            empty,
        })

        try {
            e1.name = ''
            expect(true).toBeFalsy()
        }
        catch (error) {
            if (error instanceof EntityError) {
                expect(error.name).toBe('EntityError')
                expectTypeOf(error.message).toMatchTypeOf<string>()
            }
            else {
                expect(true).toBeFalsy()
            }
        }

        expect(e1.id).toBe(id)
        expect(e1.createdAt).toBe(createdAt)
        expect(name).not.toBe(e1.name)
        expect(empty).toBe(undefined)
    })

    it('EntityLifecycle', () => {
        const id = '123'
        const createdAt = new Date()
        const name = 'daniel'

        const createEntity = defineEntity<User>({
            trace(entity) {
                expect(guard(entity)).toBeTruthy()
            },

            created(entity) {
                expect(guard(entity))
            },

            properties: {
                id: {
                    required: true,
                    validator: (value, entity) => {
                        expect(value).toBe(id)
                        expect(entity.id).toBe(id)
                        return 2 < value.length
                    },
                },

                createdAt: {
                    required: true,
                    validator: (value, entity) => {
                        expect(value).toBe(createdAt)
                        expect(entity.createdAt).toBe(createdAt)
                        return guard(value)
                    },
                },

                name: {
                    required: true,
                    validator: (value, entity) => {
                        expect(2 < value.length).toBeTruthy()
                        expect(2 < entity.name.length).toBeTruthy()
                        return 2 < value.length
                    },
                    updated: (newValue, oldValue, entity) => {
                        expect(newValue).toBe('jonathan')
                        expect(oldValue).toBe(name)
                        expect(entity.id).toBe(id)
                        expect(entity.createdAt).toBe(createdAt)
                        expect(entity.name).toBe(name)
                    },
                },
            },
        })

        const e1 = createEntity({
            id,
            createdAt,
            name,
        })

        expect(e1.id).toBe(id)
        expect(e1.createdAt).toBe(createdAt)

        e1.name = 'jonathan'

        expect('jonathan').toBe(e1.name)
    })
})