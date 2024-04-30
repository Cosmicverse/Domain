# Welcome to DomainJS

Inspired by [domain-driven design](https://en.wikipedia.org/wiki/Domain-driven_design) (DDD), DomainJS is a domain-driven design framework for scalable systems.

### Entities - What are they

In Domain-driven design (DDD) an entity is a representation of an object within a given domain, for example: a book, product order, and user would be 
entities within a domain that handles purchase orders for an e-commerce website that sold books. Let's take a look at an entity type definition for a user within our domain.

```typescript
// User.ts

import {
  Entity,
} from '@cosmicmind/domainjs'

export type User = Entity & {
  id: string
  name: string
  age: number
}
```

The above example is a user entity type definition. It represents an object, in this case a user within our domain. The user is defined by the id, name, and age attribute values. When working with entities, 
DomainJS will immediately help within the following areas of concern:

1. How to validate entities and reliably construct new entity instances?
2. How to observe the entity lifecycle?

#### How to validate entities and reliably construct new entity instances?

Let's take a look at the following code example to understand entity validation in DomainJS.

```typescript
import {
  User,
} from './User'

function someFunction(user: User): void {
  // ... do something
}

const user: User = {
  id: '123',
  name: 'Sarah',
  age: 29,
}

// ... 

someFunction(user)
```

In the above code, we can see that the `user` passed to `someFunction` actually doesn't provide any guarantees of its validity. In order to guarantee validity within
`someFunction`, validation logic would need to be executed within the function itself. An issue arises when we need to constantly validate our entities, causing validation 
logic to exist in multiple places within our codebase. DomainJS defines the validation logic within the entity itself and calls the appropriate validators when creating and 
updating entities, for example:

```typescript
// User.ts

// ...

export const makeUser = defineEntity<User>({
  attributes: {
    id: {
      validator(value): boolean | never {
        // id validation logic
        // return true | false
        // or throw an error
      },
    },
    
    name: {
      validator(value): boolean | never {
        // name validation logic
        // return true | false
        // or throw an error
      },
    },

    age: {
      validator(value): boolean | never {
        // age validation logic
        // return true | false
        // or throw an error
      },
    },
  },
})
```

```typescript
import { 
  makeUser,
} from './User'

function someFunction(user: User): void {
    // ... do something
}

const user = makeUser({
  id: '123',
  name: 'Sarah',
  age: 29,
})

console.log(user.id) // "123"
console.log(user.name) // "Sarah"
console.log(user.age) // 29

someFunction(user)
```

By using the constructor function returned by `defineEntity<User>(...)`, each user entity is guaranteed to be valid.
It is impossible for the user entity to be created and reach the code at line `someFunction(user)` if it is invalid.

#### How to observe the entity lifecycle?

DomainJS organizes lifecycle hooks within the entity definition itself, like so: 

```typescript
export const makeUser = defineEntity<User>({
  created(user) {
    // ... do something
  },
  
  trace(user) {
    // ... do something
  },
  
  attributes: {
    // ...
    
    age: {
      validator(value): boolean | never {
        // ... do something 
      }, 
      
      udpated(newValue, oldValue, user): void {
        // ... do something
      },
    },
    
    // ...
  },
})
```

The above example shows the various lifecycle hooks available for entities. Let's take a look at each one of these
hooks to understand when they are executed. 

##### created

The `created` lifecycle hook is executed only once when an instance is initially created. 

##### updated

The `updated` lifecycle hook is executed after an attribute has been updated.

##### trace

The `trace` lifecycle hook is executed after the `created` and `updated` lifecycle hooks.

### Value Objects

A Value Object (VO) in Domain-driven design encapsulates a single value and its validity. Further to ensuring its validity, 
a VO provides specific functionality that is relevant to the value itself, for example: 

```typescript
// Email.ts

import {
  Value,
  defineValue,
} from '@cosmicmind/domainjs'

export class Email extends Value<string> {
  get domainAddress(): string {
    return this.value.split('@')[1]
  }
}

export const makeEmail = defineValue(Email, {
  created(email): void {
    // ... do something
  },

  trace(email) {
    // ... do something
  },
  
  validator(value): boolean | never {
    // email validation logic
    // return true | false
    // or throw an error
  },
})
```

```typescript
import { 
  makeEmail,
} from './Email'

const email = makeEmail('me@domain.com')

console.log(email.value) // "me@domain.com"
console.log(email.domainAddress) // "domain.com"
```




... more to come ...





```typescript
// User.ts

import {
  Entity,
  defineEntity,
} from '@cosmicmind/domainjs'

import {
  Email,
} from './Email'

export type User = Entity & {
  id: string
  name: string
  age: number
  email: Email
}

export const makeUser = defineEntity<User>({
  attributes: {
    id: {
      validator(value): boolean | never {
        // id validation logic
        // return true | false
        // or throw an error
      },
    },
    
    name: {
      validator(value): boolean | never {
        // name validation logic
        // return true | false
        // or throw an error
      },
    },

    age: {
      validator(value): boolean | never {
        // age validation logic
        // return true | false
        // or throw an error
      },
    },
  },
})
```

```typescript
import { 
  makeUser,
} from './User'

import {
  makeEmail,
} from './Email'

const user = makeUser({
  id: '123',
  name: 'Daniel',
  age: 29,
  email: makeEmail('me@domain.com'),
})

console.log(user.id) // "123"
console.log(user.name) // "Daniel"
console.log(user.age) // 29
console.log(user.email.value) // "me@domain.com"
console.log(user.email.domainAddress) // "domain.com"
```

Value Objects are great for parameter passing and letting the function know that it is using a 
valid value. For example:

```typescript
import {
  Email,
} from './Email'

function someFunction(email: Email): void {
  if ('domain.com' === email.domainAddress) {
    // ... do something
  }
}
```

### Aggregates - Defining possibilities while encapsulating the logic





... more to come ...






#### Data encapsulation and value accessibility




... more to come ...





```typescript
// UserAggregate.ts

import {
  Aggregate,
  defineAggregate,
} from '@cosmicmind/domainjs'

import {
  User,
} from './User'

import {
  Email,
} from './Email'

export class UserAggregate extends Aggregate<User> {
  get id(): string {
    return this.root.id
  }

  get email(): Email {
    return this.root.email
  }

  registerAccount(): void {
    // ... do something
  }
}

export const makeUserAggregate = defineAggregate(UserAggregate, {
  created(user) {
    // ... do something
  },

  trace(user) {
    // ... do something
  },

  attributes: {
    // ...

    age: {
      validator(value): boolean | never {
        // ... do something 
      },

      udpated(newValue, oldValue, user): void {
        // ... do something
      },
    },

    // ...
  },
})
```

```typescript
import { 
  makeUserAggregate
} from './UserAggregate'

import {
  makeEmail,
} from './Email'

const user = makeUserAggregate({
  id: '123',
  name: 'Daniel',
  age: 29,
  email: makeEmail('me@domain.com'),
})

console.log(user.id) // "123"
console.log(user.name) // error cannot access (not exposed in UserAggragte)
console.log(user.age) // error cannot access (not exposed in UserAggragte)
console.log(user.email.value) // "me@domain.com"
console.log(user.email.domainAddress) // "domain.com"

user.registerAccount() // ... account registration process
```





... more to come ...






### Aggregate Events





... more to come ...





```typescript
// RegisterAccountEvent.ts

import {
  Event,
  defineEvent,
} from '@cosmicmind/domainjs'

import {
  User,
} from './User'

export type RegisterAccountEvent = Event & {
  id: string
  user: User
}

export const createRegisterAccountEvent = defineEvent<RegisterAccountEvent>({
  attributes: {
    id: {
      validator(value): boolean | never {
        // id validation logic
        // return true | false
        // or throw an error
      },
    },
  },
})
```

Now that we have our `RegisterAccountEvent`, let's add it to the `UserAggregate` example. 

```typescript
// UserAggregate.ts

import {
  Aggregate,
  defineAggregate,
  EventTopics,
} from '@cosmicmind/domainjs'

// ...

import {
  RegisterAccountEvent,
  createRegisterAccountEvent,
} from './RegisterAccountEvent'

export type UserAggregateEventTopics = EventTopics & {
  'register-account': RegisterAccountEvent
}

export class UserAggregate extends Aggregate<User, UserAggregateEventTopics> {
  // ...

  registerAccount(): void {
    // ... do something

    this.publishSync('register-account', createRegisterAccountEvent({
      id: '123',
      user: this.root,
    }))
  }
}

// ...
```

```typescript
import { 
  makeUserAggregate
} from './UserAggregate'

import {
  makeEmail,
} from './Email'

const user = makeUserAggregate({
  id: '123',
  name: 'Daniel',
  age: 29,
  email: makeEmail('me@domain.com'),
})

user.subscribe('register-account', (event: RegisterAccountEvent) => {
  // ... do something
})

console.log(user.id) // "123"
console.log(user.name) // error cannot access (not exposed in UserAggragte)
console.log(user.age) // error cannot access (not exposed in UserAggragte)
console.log(user.email.value) // "me@domain.com"
console.log(user.email.domainAddress) // "domain.com"

user.registerAccount() // ... account registration process and event is published
```

## What's Next

Additional documentation and examples will follow shortly. If you have any examples or use cases that 
you are interested in exploring, please create a discussion. 

Thank you! 
