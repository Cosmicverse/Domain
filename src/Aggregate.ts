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
 * @module Aggregate
 */

import {
    Entity,
    EntityLifecycle,
    defineEntity,
} from '@/Entity'
import {
    EventTopics,
    EventObservable,
} from '@/Event'

export abstract class Aggregate<E extends Entity, T extends EventTopics = EventTopics> extends EventObservable<T> {
    protected root: E

    constructor(root: E) {
        super()
        this.root = 'function' === typeof this.prepare ? this.prepare(root) : root
    }

    protected prepare?(root: E): E
}

export type AggregateTypeFor<A> = A extends Aggregate<infer E> ? E : A

export type AggregateConstructor<A extends Aggregate<Entity>> = new (root: AggregateTypeFor<A>) => A

export function defineAggregate<A extends Aggregate<Entity>>(_class: AggregateConstructor<A>, handler: EntityLifecycle<AggregateTypeFor<A>> = {}): (root: AggregateTypeFor<A>) => A {
    const createEntity = defineEntity<AggregateTypeFor<A>>(handler)
    return (root: AggregateTypeFor<A>): A => new _class(createEntity(root))
}