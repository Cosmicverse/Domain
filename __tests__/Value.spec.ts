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
  ValidationError,
} from 'yup'

import {
  Value,
  ValueError,
  defineValue,
} from '@/index'

class Email extends Value<string> {
  get domainAddress(): string {
    return this.value.split('@')[1]
  }

  protected prepare(value: string): string {
    return value.trim().toLowerCase()
  }
}

const createEmail = defineValue(Email, {
  validator: (value: string): boolean =>
    'string' === typeof string().email('email is invalid').strict(true).validateSync(value),
})

class Version extends Value<number> {}

const createVersionValue = defineValue(Version, {
  validator: (value: number): boolean => 0 < value,
})

describe('Value', () => {
  it('create value', () => {
    const email = 'ME@domain.com'
    const vo = createEmail(email)
    expect(vo.value).not.toBe(email)
    expect(vo.value).toBe(email.toLowerCase())
  })

  it('ValueError', () => {
    try {
      createVersionValue(0)
      expect(true).toBeFalsy()
    }
    catch (error) {
      if (error instanceof ValueError) {
        expect(error.name, 'ValueError')
        expect(error.message, 'value is invalid')
      }
      else {
        expect(true).toBeFalsy()
      }
    }
  })

  it('ValidationError', () => {
    try {
      createEmail('123')
      expect(true).toBeFalsy()
    }
    catch (error) {
      if (error instanceof ValidationError) {
        expect(error.name, 'ValidationError')
        expect(error.message, 'email is invalid')
      }
      else {
        expect(true).toBeFalsy()
      }
    }
  })

  it('get computed value', () => {
    const email1 = 'me@domain.com'
    const vo1 = createEmail(email1)

    const email2 = 'you@domain.com'
    const vo2 = createEmail(email2)

    expect(vo1.value).toBe(email1)
    expect(vo2.value).toBe(email2)
    expect(vo1.domainAddress).toBe(vo2.domainAddress)
  })

  it('ValueLifecycle', () => {
    const email = 'me@domain.com'

    const createValue = defineValue(Email, {
      trace(vo: Email): void {
        expect(email).toBe(vo.value)
      },

      validator(value: string, vo: Email): boolean {
        expect(email).toBe(value)
        expect(email).toBe(vo.value)
        return 'string' === typeof string().email('email is invalid').strict(true).validateSync(value)
      },

      created(vo: Email): void {
        expect(email).toBe(vo.value)
      },
    })

    const vo = createValue(email)
    expect(vo.value).toBe(email)
    expect(vo.domainAddress).toBe(email.split('@')[1])
  })
})
