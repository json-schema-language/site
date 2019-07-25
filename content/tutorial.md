---
type: page
flytitle: "Tutorial"
title: "Learn JSON Schema Language in 5 Minutes"
rubric: "Everything worth knowing about JSON Schema Language"
---

JSON Schema Language (aka "JSL") is a way to describe shape of JSON data. This
document will explain in five minutes all of the major features in JSL. By the
end of it, you'll be able to read any JSL schema, and understand exactly what
it's doing.

An **empty** schema is the simplest kind of schema. It looks like this:

```json
{}
```

Empty schemas are like `any` in TypeScript or `Object` in Java. They accept
anything.

A **type** schema lets you specify what kind of primitive data you require. It
looks like this:

```json
{ "type": "string" }
```

That schema says "the data must be a string". The values you can put for `type`
are:

* `boolean` is like TypeScript's or Java's `boolean`.
* `string` is like TypeScript's `string` or Java's `String`.
* `timestamp` says the data has to be an [RFC3339][rfc3339] timestamp. That's
  the standard timestamp format for the internet.
* `number`, `float32`, and `float64` all work like TypeScript's `number`. They
  accept any JSON number, whether or not they're floating-point.
* Then there are a bunch of integer types: `int8`, `uint8`, `int16`, `uint16`,
  `int32`, `uint32`, `int64`, `uint64`. They check that the data is an integer,
  and that it falls within a particular range of values. For example, `uint8`
  only accepts values between 0 and 255.

If some of your data is a string, but there are only a handful of valid values
for that string, then you can use an **enum** schema to handle this case. It
looks like this:

```json
{ "enum": ["GOOD", "BAD", "UGLY" ]}
```

That's equivalent to this TypeScript:

```ts
type MyEnum = "GOOD" | "BAD" | "UGLY";
```

or Java:

```java
enum MyEnum {
  GOOD("GOOD"), BAD("BAD"), UGLY("UGLY")
}
```

So far, we've only been able to describe primitive data. To describe arrays, you
can use an **elements** schema. It looks like this:

```json
{ "elements": { "type": "string" }}
```

That schema says "the data has to be an array of strings". You can stick any JSL
schema inside `elements`.

There are three major ways people use JSON objects. JSL handles of them
differently:

When a JSON object is most like a *struct*, where you know the key names in
advance, you can use a **properties** schema. They look like this:

```json
{
  "properties": {
    "name": { "type": "string" },
    "age": { "type": "number" }
  },
  "optionalProperties": {
    "favoriteNumber": { "type": "number" }
  }
}
```

That schema says "the data has to be an object with `name` (a string) and `age`
(a number). `favoriteNumber` is optional, but if it's present it has to be a
number". It's equivalent to this TypeScript:

```ts
interface MyData {
  name: string
  age: number
  favoriteNumber?: number
}
```

In Java, it's like:

```java
public class MyData {
  @NotNull
  private String name;

  @NotNull
  private double age;

  @Nullable
  private Double favoriteNumber;
}
```

When a data is most like a *dictionary*, where you don't know the key names, but
you do know what the type of all the values are, you can use a **values**
schema. They look like this:

```json
{ "values": { "type": "boolean" }}
```

That schema says "the data has to be an object where all the values are
booleans". It's equivalent to `Map<String, Boolean>` in Java.

When data is most like a *discriminated union*, also known as a *tagged union*,
where you first have to read one of properties, and then based on its value you
know what kind of data you're dealing with, then you can use a **discriminator**
schema. They look like this:

```json
{
  "discriminator": {
    "tag": "eventType",
    "mapping": {
      "User Deleted": {
        "properties": {
          "userId": { "type": "string" }
        }
      },
      "User Changed Email": {
        "properties": {
          "userId": { "type": "string" },
          "email": { "type": "string" }
        }
      }
    }
  }
}
```

That schema is saying "the data has to be an object with an `eventType`
property. If the `eventType` is `User Deleted`, then the data has to have a
`userId` (a string). If the `eventType` is `User Changed Email`, then it has to
have a `userId` (a string) and `email` (a string). If the `eventType` is
anything else, then the data is invalid".

In TypeScript, this is equivalent to:

```ts
type MyData = UserDeleted | UserChangedEmail;

interface UserDeleted {
  eventType: "User Deleted"
  userId: string
}

interface UserChangedEmail {
  eventType: "User Changed Email"
  userId: string
  email: string
}
```

That's the entire syntax of JSL. You might now want to [see example
schemas][examples] or check out some [real-world use-cases][use-cases].

[examples]: /examples.html
[use-cases]: /use-cases/index.html

[rfc3339]: https://tools.ietf.org/html/rfc3339
