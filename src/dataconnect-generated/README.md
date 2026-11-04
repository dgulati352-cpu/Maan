# Generated TypeScript README
This README will guide you through the process of using the generated JavaScript SDK package for the connector `example`. It will also provide examples on how to use your generated SDK to call your Data Connect queries and mutations.

***NOTE:** This README is generated alongside the generated SDK. If you make changes to this file, they will be overwritten when the SDK is regenerated.*

# Table of Contents
- [**Overview**](#generated-javascript-readme)
- [**Accessing the connector**](#accessing-the-connector)
  - [*Connecting to the local Emulator*](#connecting-to-the-local-emulator)
- [**Queries**](#queries)
  - [*GetCouple*](#getcouple)
  - [*ListCouples*](#listcouples)
  - [*GetGuest*](#getguest)
  - [*ListGuests*](#listguests)
  - [*GetEvent*](#getevent)
  - [*ListEvents*](#listevents)
  - [*GetRSVP*](#getrsvp)
  - [*ListRSVPs*](#listrsvps)
  - [*GetDocument*](#getdocument)
  - [*ListDocuments*](#listdocuments)
- [**Mutations**](#mutations)
  - [*CreateCouple*](#createcouple)
  - [*UpdateCouple*](#updatecouple)
  - [*DeleteCouple*](#deletecouple)
  - [*CreateGuest*](#createguest)
  - [*UpdateGuest*](#updateguest)
  - [*DeleteGuest*](#deleteguest)
  - [*CreateEvent*](#createevent)
  - [*UpdateEvent*](#updateevent)
  - [*DeleteEvent*](#deleteevent)
  - [*CreateRSVP*](#creatersvp)
  - [*UpdateRSVP*](#updatersvp)
  - [*DeleteRSVP*](#deletersvp)
  - [*CreateDocument*](#createdocument)
  - [*UpdateDocument*](#updatedocument)
  - [*DeleteDocument*](#deletedocument)

# Accessing the connector
A connector is a collection of Queries and Mutations. One SDK is generated for each connector - this SDK is generated for the connector `example`. You can find more information about connectors in the [Data Connect documentation](https://firebase.google.com/docs/data-connect#how-does).

You can use this generated SDK by importing from the package `@dataconnect/generated` as shown below. Both CommonJS and ESM imports are supported.

You can also follow the instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#set-client).

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
```

## Connecting to the local Emulator
By default, the connector will connect to the production service.

To connect to the emulator, you can use the following code.
You can also follow the emulator instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#instrument-clients).

```typescript
import { connectDataConnectEmulator, getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
connectDataConnectEmulator(dataConnect, 'localhost', 9399);
```

After it's initialized, you can call your Data Connect [queries](#queries) and [mutations](#mutations) from your generated SDK.

# Queries

There are two ways to execute a Data Connect Query using the generated Web SDK:
- Using a Query Reference function, which returns a `QueryRef`
  - The `QueryRef` can be used as an argument to `executeQuery()`, which will execute the Query and return a `QueryPromise`
- Using an action shortcut function, which returns a `QueryPromise`
  - Calling the action shortcut function will execute the Query and return a `QueryPromise`

The following is true for both the action shortcut function and the `QueryRef` function:
- The `QueryPromise` returned will resolve to the result of the Query once it has finished executing
- If the Query accepts arguments, both the action shortcut function and the `QueryRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Query
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `example` connector's generated functions to execute each query. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-queries).

## GetCouple
You can execute the `GetCouple` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getCouple(vars: GetCoupleVariables, options?: ExecuteQueryOptions): QueryPromise<GetCoupleData, GetCoupleVariables>;

interface GetCoupleRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetCoupleVariables): QueryRef<GetCoupleData, GetCoupleVariables>;
}
export const getCoupleRef: GetCoupleRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getCouple(dc: DataConnect, vars: GetCoupleVariables, options?: ExecuteQueryOptions): QueryPromise<GetCoupleData, GetCoupleVariables>;

interface GetCoupleRef {
  ...
  (dc: DataConnect, vars: GetCoupleVariables): QueryRef<GetCoupleData, GetCoupleVariables>;
}
export const getCoupleRef: GetCoupleRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getCoupleRef:
```typescript
const name = getCoupleRef.operationName;
console.log(name);
```

### Variables
The `GetCouple` query requires an argument of type `GetCoupleVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface GetCoupleVariables {
  id: UUIDString;
}
```
### Return Type
Recall that executing the `GetCouple` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetCoupleData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface GetCoupleData {
  couple?: {
    partnerName1: string;
    partnerName2: string;
    weddingDate: DateString;
  };
}
```
### Using `GetCouple`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getCouple, GetCoupleVariables } from '@dataconnect/generated';

// The `GetCouple` query requires an argument of type `GetCoupleVariables`:
const getCoupleVars: GetCoupleVariables = {
  id: ..., 
};

// Call the `getCouple()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getCouple(getCoupleVars);
// Variables can be defined inline as well.
const { data } = await getCouple({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getCouple(dataConnect, getCoupleVars);

console.log(data.couple);

// Or, you can use the `Promise` API.
getCouple(getCoupleVars).then((response) => {
  const data = response.data;
  console.log(data.couple);
});
```

### Using `GetCouple`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getCoupleRef, GetCoupleVariables } from '@dataconnect/generated';

// The `GetCouple` query requires an argument of type `GetCoupleVariables`:
const getCoupleVars: GetCoupleVariables = {
  id: ..., 
};

// Call the `getCoupleRef()` function to get a reference to the query.
const ref = getCoupleRef(getCoupleVars);
// Variables can be defined inline as well.
const ref = getCoupleRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getCoupleRef(dataConnect, getCoupleVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.couple);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.couple);
});
```

## ListCouples
You can execute the `ListCouples` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
listCouples(options?: ExecuteQueryOptions): QueryPromise<ListCouplesData, undefined>;

interface ListCouplesRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListCouplesData, undefined>;
}
export const listCouplesRef: ListCouplesRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listCouples(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListCouplesData, undefined>;

interface ListCouplesRef {
  ...
  (dc: DataConnect): QueryRef<ListCouplesData, undefined>;
}
export const listCouplesRef: ListCouplesRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listCouplesRef:
```typescript
const name = listCouplesRef.operationName;
console.log(name);
```

### Variables
The `ListCouples` query has no variables.
### Return Type
Recall that executing the `ListCouples` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListCouplesData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ListCouplesData {
  couples: ({
    partnerName1: string;
    partnerName2: string;
  })[];
}
```
### Using `ListCouples`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listCouples } from '@dataconnect/generated';


// Call the `listCouples()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listCouples();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listCouples(dataConnect);

console.log(data.couples);

// Or, you can use the `Promise` API.
listCouples().then((response) => {
  const data = response.data;
  console.log(data.couples);
});
```

### Using `ListCouples`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listCouplesRef } from '@dataconnect/generated';


// Call the `listCouplesRef()` function to get a reference to the query.
const ref = listCouplesRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listCouplesRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.couples);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.couples);
});
```

## GetGuest
You can execute the `GetGuest` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getGuest(vars: GetGuestVariables, options?: ExecuteQueryOptions): QueryPromise<GetGuestData, GetGuestVariables>;

interface GetGuestRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetGuestVariables): QueryRef<GetGuestData, GetGuestVariables>;
}
export const getGuestRef: GetGuestRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getGuest(dc: DataConnect, vars: GetGuestVariables, options?: ExecuteQueryOptions): QueryPromise<GetGuestData, GetGuestVariables>;

interface GetGuestRef {
  ...
  (dc: DataConnect, vars: GetGuestVariables): QueryRef<GetGuestData, GetGuestVariables>;
}
export const getGuestRef: GetGuestRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getGuestRef:
```typescript
const name = getGuestRef.operationName;
console.log(name);
```

### Variables
The `GetGuest` query requires an argument of type `GetGuestVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface GetGuestVariables {
  id: UUIDString;
}
```
### Return Type
Recall that executing the `GetGuest` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetGuestData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface GetGuestData {
  guest?: {
    name: string;
    email: string;
  };
}
```
### Using `GetGuest`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getGuest, GetGuestVariables } from '@dataconnect/generated';

// The `GetGuest` query requires an argument of type `GetGuestVariables`:
const getGuestVars: GetGuestVariables = {
  id: ..., 
};

// Call the `getGuest()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getGuest(getGuestVars);
// Variables can be defined inline as well.
const { data } = await getGuest({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getGuest(dataConnect, getGuestVars);

console.log(data.guest);

// Or, you can use the `Promise` API.
getGuest(getGuestVars).then((response) => {
  const data = response.data;
  console.log(data.guest);
});
```

### Using `GetGuest`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getGuestRef, GetGuestVariables } from '@dataconnect/generated';

// The `GetGuest` query requires an argument of type `GetGuestVariables`:
const getGuestVars: GetGuestVariables = {
  id: ..., 
};

// Call the `getGuestRef()` function to get a reference to the query.
const ref = getGuestRef(getGuestVars);
// Variables can be defined inline as well.
const ref = getGuestRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getGuestRef(dataConnect, getGuestVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.guest);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.guest);
});
```

## ListGuests
You can execute the `ListGuests` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
listGuests(options?: ExecuteQueryOptions): QueryPromise<ListGuestsData, undefined>;

interface ListGuestsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListGuestsData, undefined>;
}
export const listGuestsRef: ListGuestsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listGuests(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListGuestsData, undefined>;

interface ListGuestsRef {
  ...
  (dc: DataConnect): QueryRef<ListGuestsData, undefined>;
}
export const listGuestsRef: ListGuestsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listGuestsRef:
```typescript
const name = listGuestsRef.operationName;
console.log(name);
```

### Variables
The `ListGuests` query has no variables.
### Return Type
Recall that executing the `ListGuests` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListGuestsData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ListGuestsData {
  guests: ({
    name: string;
    email: string;
  })[];
}
```
### Using `ListGuests`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listGuests } from '@dataconnect/generated';


// Call the `listGuests()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listGuests();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listGuests(dataConnect);

console.log(data.guests);

// Or, you can use the `Promise` API.
listGuests().then((response) => {
  const data = response.data;
  console.log(data.guests);
});
```

### Using `ListGuests`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listGuestsRef } from '@dataconnect/generated';


// Call the `listGuestsRef()` function to get a reference to the query.
const ref = listGuestsRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listGuestsRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.guests);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.guests);
});
```

## GetEvent
You can execute the `GetEvent` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getEvent(vars: GetEventVariables, options?: ExecuteQueryOptions): QueryPromise<GetEventData, GetEventVariables>;

interface GetEventRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetEventVariables): QueryRef<GetEventData, GetEventVariables>;
}
export const getEventRef: GetEventRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getEvent(dc: DataConnect, vars: GetEventVariables, options?: ExecuteQueryOptions): QueryPromise<GetEventData, GetEventVariables>;

interface GetEventRef {
  ...
  (dc: DataConnect, vars: GetEventVariables): QueryRef<GetEventData, GetEventVariables>;
}
export const getEventRef: GetEventRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getEventRef:
```typescript
const name = getEventRef.operationName;
console.log(name);
```

### Variables
The `GetEvent` query requires an argument of type `GetEventVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface GetEventVariables {
  id: UUIDString;
}
```
### Return Type
Recall that executing the `GetEvent` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetEventData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface GetEventData {
  event?: {
    title: string;
    eventDate: TimestampString;
    location: string;
  };
}
```
### Using `GetEvent`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getEvent, GetEventVariables } from '@dataconnect/generated';

// The `GetEvent` query requires an argument of type `GetEventVariables`:
const getEventVars: GetEventVariables = {
  id: ..., 
};

// Call the `getEvent()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getEvent(getEventVars);
// Variables can be defined inline as well.
const { data } = await getEvent({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getEvent(dataConnect, getEventVars);

console.log(data.event);

// Or, you can use the `Promise` API.
getEvent(getEventVars).then((response) => {
  const data = response.data;
  console.log(data.event);
});
```

### Using `GetEvent`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getEventRef, GetEventVariables } from '@dataconnect/generated';

// The `GetEvent` query requires an argument of type `GetEventVariables`:
const getEventVars: GetEventVariables = {
  id: ..., 
};

// Call the `getEventRef()` function to get a reference to the query.
const ref = getEventRef(getEventVars);
// Variables can be defined inline as well.
const ref = getEventRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getEventRef(dataConnect, getEventVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.event);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.event);
});
```

## ListEvents
You can execute the `ListEvents` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
listEvents(options?: ExecuteQueryOptions): QueryPromise<ListEventsData, undefined>;

interface ListEventsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListEventsData, undefined>;
}
export const listEventsRef: ListEventsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listEvents(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListEventsData, undefined>;

interface ListEventsRef {
  ...
  (dc: DataConnect): QueryRef<ListEventsData, undefined>;
}
export const listEventsRef: ListEventsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listEventsRef:
```typescript
const name = listEventsRef.operationName;
console.log(name);
```

### Variables
The `ListEvents` query has no variables.
### Return Type
Recall that executing the `ListEvents` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListEventsData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ListEventsData {
  events: ({
    title: string;
    eventDate: TimestampString;
  })[];
}
```
### Using `ListEvents`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listEvents } from '@dataconnect/generated';


// Call the `listEvents()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listEvents();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listEvents(dataConnect);

console.log(data.events);

// Or, you can use the `Promise` API.
listEvents().then((response) => {
  const data = response.data;
  console.log(data.events);
});
```

### Using `ListEvents`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listEventsRef } from '@dataconnect/generated';


// Call the `listEventsRef()` function to get a reference to the query.
const ref = listEventsRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listEventsRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.events);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.events);
});
```

## GetRSVP
You can execute the `GetRSVP` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getRsvp(vars: GetRsvpVariables, options?: ExecuteQueryOptions): QueryPromise<GetRsvpData, GetRsvpVariables>;

interface GetRsvpRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetRsvpVariables): QueryRef<GetRsvpData, GetRsvpVariables>;
}
export const getRsvpRef: GetRsvpRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getRsvp(dc: DataConnect, vars: GetRsvpVariables, options?: ExecuteQueryOptions): QueryPromise<GetRsvpData, GetRsvpVariables>;

interface GetRsvpRef {
  ...
  (dc: DataConnect, vars: GetRsvpVariables): QueryRef<GetRsvpData, GetRsvpVariables>;
}
export const getRsvpRef: GetRsvpRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getRsvpRef:
```typescript
const name = getRsvpRef.operationName;
console.log(name);
```

### Variables
The `GetRSVP` query requires an argument of type `GetRsvpVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface GetRsvpVariables {
  id: UUIDString;
}
```
### Return Type
Recall that executing the `GetRSVP` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetRsvpData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface GetRsvpData {
  rSVP?: {
    status: string;
    note?: string | null;
  };
}
```
### Using `GetRSVP`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getRsvp, GetRsvpVariables } from '@dataconnect/generated';

// The `GetRSVP` query requires an argument of type `GetRsvpVariables`:
const getRsvpVars: GetRsvpVariables = {
  id: ..., 
};

// Call the `getRsvp()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getRsvp(getRsvpVars);
// Variables can be defined inline as well.
const { data } = await getRsvp({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getRsvp(dataConnect, getRsvpVars);

console.log(data.rSVP);

// Or, you can use the `Promise` API.
getRsvp(getRsvpVars).then((response) => {
  const data = response.data;
  console.log(data.rSVP);
});
```

### Using `GetRSVP`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getRsvpRef, GetRsvpVariables } from '@dataconnect/generated';

// The `GetRSVP` query requires an argument of type `GetRsvpVariables`:
const getRsvpVars: GetRsvpVariables = {
  id: ..., 
};

// Call the `getRsvpRef()` function to get a reference to the query.
const ref = getRsvpRef(getRsvpVars);
// Variables can be defined inline as well.
const ref = getRsvpRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getRsvpRef(dataConnect, getRsvpVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.rSVP);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.rSVP);
});
```

## ListRSVPs
You can execute the `ListRSVPs` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
listRsvPs(options?: ExecuteQueryOptions): QueryPromise<ListRsvPsData, undefined>;

interface ListRsvPsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListRsvPsData, undefined>;
}
export const listRsvPsRef: ListRsvPsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listRsvPs(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListRsvPsData, undefined>;

interface ListRsvPsRef {
  ...
  (dc: DataConnect): QueryRef<ListRsvPsData, undefined>;
}
export const listRsvPsRef: ListRsvPsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listRsvPsRef:
```typescript
const name = listRsvPsRef.operationName;
console.log(name);
```

### Variables
The `ListRSVPs` query has no variables.
### Return Type
Recall that executing the `ListRSVPs` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListRsvPsData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ListRsvPsData {
  rSVPS: ({
    status: string;
    note?: string | null;
  })[];
}
```
### Using `ListRSVPs`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listRsvPs } from '@dataconnect/generated';


// Call the `listRsvPs()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listRsvPs();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listRsvPs(dataConnect);

console.log(data.rSVPS);

// Or, you can use the `Promise` API.
listRsvPs().then((response) => {
  const data = response.data;
  console.log(data.rSVPS);
});
```

### Using `ListRSVPs`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listRsvPsRef } from '@dataconnect/generated';


// Call the `listRsvPsRef()` function to get a reference to the query.
const ref = listRsvPsRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listRsvPsRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.rSVPS);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.rSVPS);
});
```

## GetDocument
You can execute the `GetDocument` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getDocument(vars: GetDocumentVariables, options?: ExecuteQueryOptions): QueryPromise<GetDocumentData, GetDocumentVariables>;

interface GetDocumentRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetDocumentVariables): QueryRef<GetDocumentData, GetDocumentVariables>;
}
export const getDocumentRef: GetDocumentRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getDocument(dc: DataConnect, vars: GetDocumentVariables, options?: ExecuteQueryOptions): QueryPromise<GetDocumentData, GetDocumentVariables>;

interface GetDocumentRef {
  ...
  (dc: DataConnect, vars: GetDocumentVariables): QueryRef<GetDocumentData, GetDocumentVariables>;
}
export const getDocumentRef: GetDocumentRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getDocumentRef:
```typescript
const name = getDocumentRef.operationName;
console.log(name);
```

### Variables
The `GetDocument` query requires an argument of type `GetDocumentVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface GetDocumentVariables {
  id: UUIDString;
}
```
### Return Type
Recall that executing the `GetDocument` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetDocumentData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface GetDocumentData {
  document?: {
    title: string;
    url: string;
  };
}
```
### Using `GetDocument`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getDocument, GetDocumentVariables } from '@dataconnect/generated';

// The `GetDocument` query requires an argument of type `GetDocumentVariables`:
const getDocumentVars: GetDocumentVariables = {
  id: ..., 
};

// Call the `getDocument()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getDocument(getDocumentVars);
// Variables can be defined inline as well.
const { data } = await getDocument({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getDocument(dataConnect, getDocumentVars);

console.log(data.document);

// Or, you can use the `Promise` API.
getDocument(getDocumentVars).then((response) => {
  const data = response.data;
  console.log(data.document);
});
```

### Using `GetDocument`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getDocumentRef, GetDocumentVariables } from '@dataconnect/generated';

// The `GetDocument` query requires an argument of type `GetDocumentVariables`:
const getDocumentVars: GetDocumentVariables = {
  id: ..., 
};

// Call the `getDocumentRef()` function to get a reference to the query.
const ref = getDocumentRef(getDocumentVars);
// Variables can be defined inline as well.
const ref = getDocumentRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getDocumentRef(dataConnect, getDocumentVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.document);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.document);
});
```

## ListDocuments
You can execute the `ListDocuments` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
listDocuments(options?: ExecuteQueryOptions): QueryPromise<ListDocumentsData, undefined>;

interface ListDocumentsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListDocumentsData, undefined>;
}
export const listDocumentsRef: ListDocumentsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listDocuments(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListDocumentsData, undefined>;

interface ListDocumentsRef {
  ...
  (dc: DataConnect): QueryRef<ListDocumentsData, undefined>;
}
export const listDocumentsRef: ListDocumentsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listDocumentsRef:
```typescript
const name = listDocumentsRef.operationName;
console.log(name);
```

### Variables
The `ListDocuments` query has no variables.
### Return Type
Recall that executing the `ListDocuments` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListDocumentsData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ListDocumentsData {
  documents: ({
    title: string;
    url: string;
  })[];
}
```
### Using `ListDocuments`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listDocuments } from '@dataconnect/generated';


// Call the `listDocuments()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listDocuments();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listDocuments(dataConnect);

console.log(data.documents);

// Or, you can use the `Promise` API.
listDocuments().then((response) => {
  const data = response.data;
  console.log(data.documents);
});
```

### Using `ListDocuments`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listDocumentsRef } from '@dataconnect/generated';


// Call the `listDocumentsRef()` function to get a reference to the query.
const ref = listDocumentsRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listDocumentsRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.documents);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.documents);
});
```

# Mutations

There are two ways to execute a Data Connect Mutation using the generated Web SDK:
- Using a Mutation Reference function, which returns a `MutationRef`
  - The `MutationRef` can be used as an argument to `executeMutation()`, which will execute the Mutation and return a `MutationPromise`
- Using an action shortcut function, which returns a `MutationPromise`
  - Calling the action shortcut function will execute the Mutation and return a `MutationPromise`

The following is true for both the action shortcut function and the `MutationRef` function:
- The `MutationPromise` returned will resolve to the result of the Mutation once it has finished executing
- If the Mutation accepts arguments, both the action shortcut function and the `MutationRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Mutation
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `example` connector's generated functions to execute each mutation. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-mutations).

## CreateCouple
You can execute the `CreateCouple` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
createCouple(vars: CreateCoupleVariables): MutationPromise<CreateCoupleData, CreateCoupleVariables>;

interface CreateCoupleRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateCoupleVariables): MutationRef<CreateCoupleData, CreateCoupleVariables>;
}
export const createCoupleRef: CreateCoupleRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createCouple(dc: DataConnect, vars: CreateCoupleVariables): MutationPromise<CreateCoupleData, CreateCoupleVariables>;

interface CreateCoupleRef {
  ...
  (dc: DataConnect, vars: CreateCoupleVariables): MutationRef<CreateCoupleData, CreateCoupleVariables>;
}
export const createCoupleRef: CreateCoupleRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createCoupleRef:
```typescript
const name = createCoupleRef.operationName;
console.log(name);
```

### Variables
The `CreateCouple` mutation requires an argument of type `CreateCoupleVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface CreateCoupleVariables {
  partner1: string;
  partner2: string;
  date: DateString;
}
```
### Return Type
Recall that executing the `CreateCouple` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreateCoupleData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CreateCoupleData {
  couple_insert: Couple_Key;
}
```
### Using `CreateCouple`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createCouple, CreateCoupleVariables } from '@dataconnect/generated';

// The `CreateCouple` mutation requires an argument of type `CreateCoupleVariables`:
const createCoupleVars: CreateCoupleVariables = {
  partner1: ..., 
  partner2: ..., 
  date: ..., 
};

// Call the `createCouple()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createCouple(createCoupleVars);
// Variables can be defined inline as well.
const { data } = await createCouple({ partner1: ..., partner2: ..., date: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createCouple(dataConnect, createCoupleVars);

console.log(data.couple_insert);

// Or, you can use the `Promise` API.
createCouple(createCoupleVars).then((response) => {
  const data = response.data;
  console.log(data.couple_insert);
});
```

### Using `CreateCouple`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createCoupleRef, CreateCoupleVariables } from '@dataconnect/generated';

// The `CreateCouple` mutation requires an argument of type `CreateCoupleVariables`:
const createCoupleVars: CreateCoupleVariables = {
  partner1: ..., 
  partner2: ..., 
  date: ..., 
};

// Call the `createCoupleRef()` function to get a reference to the mutation.
const ref = createCoupleRef(createCoupleVars);
// Variables can be defined inline as well.
const ref = createCoupleRef({ partner1: ..., partner2: ..., date: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createCoupleRef(dataConnect, createCoupleVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.couple_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.couple_insert);
});
```

## UpdateCouple
You can execute the `UpdateCouple` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
updateCouple(vars: UpdateCoupleVariables): MutationPromise<UpdateCoupleData, UpdateCoupleVariables>;

interface UpdateCoupleRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateCoupleVariables): MutationRef<UpdateCoupleData, UpdateCoupleVariables>;
}
export const updateCoupleRef: UpdateCoupleRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
updateCouple(dc: DataConnect, vars: UpdateCoupleVariables): MutationPromise<UpdateCoupleData, UpdateCoupleVariables>;

interface UpdateCoupleRef {
  ...
  (dc: DataConnect, vars: UpdateCoupleVariables): MutationRef<UpdateCoupleData, UpdateCoupleVariables>;
}
export const updateCoupleRef: UpdateCoupleRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the updateCoupleRef:
```typescript
const name = updateCoupleRef.operationName;
console.log(name);
```

### Variables
The `UpdateCouple` mutation requires an argument of type `UpdateCoupleVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface UpdateCoupleVariables {
  id: UUIDString;
  location?: string | null;
}
```
### Return Type
Recall that executing the `UpdateCouple` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpdateCoupleData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpdateCoupleData {
  couple_update?: Couple_Key | null;
}
```
### Using `UpdateCouple`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, updateCouple, UpdateCoupleVariables } from '@dataconnect/generated';

// The `UpdateCouple` mutation requires an argument of type `UpdateCoupleVariables`:
const updateCoupleVars: UpdateCoupleVariables = {
  id: ..., 
  location: ..., // optional
};

// Call the `updateCouple()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await updateCouple(updateCoupleVars);
// Variables can be defined inline as well.
const { data } = await updateCouple({ id: ..., location: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await updateCouple(dataConnect, updateCoupleVars);

console.log(data.couple_update);

// Or, you can use the `Promise` API.
updateCouple(updateCoupleVars).then((response) => {
  const data = response.data;
  console.log(data.couple_update);
});
```

### Using `UpdateCouple`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, updateCoupleRef, UpdateCoupleVariables } from '@dataconnect/generated';

// The `UpdateCouple` mutation requires an argument of type `UpdateCoupleVariables`:
const updateCoupleVars: UpdateCoupleVariables = {
  id: ..., 
  location: ..., // optional
};

// Call the `updateCoupleRef()` function to get a reference to the mutation.
const ref = updateCoupleRef(updateCoupleVars);
// Variables can be defined inline as well.
const ref = updateCoupleRef({ id: ..., location: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = updateCoupleRef(dataConnect, updateCoupleVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.couple_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.couple_update);
});
```

## DeleteCouple
You can execute the `DeleteCouple` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
deleteCouple(vars: DeleteCoupleVariables): MutationPromise<DeleteCoupleData, DeleteCoupleVariables>;

interface DeleteCoupleRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteCoupleVariables): MutationRef<DeleteCoupleData, DeleteCoupleVariables>;
}
export const deleteCoupleRef: DeleteCoupleRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
deleteCouple(dc: DataConnect, vars: DeleteCoupleVariables): MutationPromise<DeleteCoupleData, DeleteCoupleVariables>;

interface DeleteCoupleRef {
  ...
  (dc: DataConnect, vars: DeleteCoupleVariables): MutationRef<DeleteCoupleData, DeleteCoupleVariables>;
}
export const deleteCoupleRef: DeleteCoupleRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the deleteCoupleRef:
```typescript
const name = deleteCoupleRef.operationName;
console.log(name);
```

### Variables
The `DeleteCouple` mutation requires an argument of type `DeleteCoupleVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface DeleteCoupleVariables {
  id: UUIDString;
}
```
### Return Type
Recall that executing the `DeleteCouple` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `DeleteCoupleData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface DeleteCoupleData {
  couple_delete?: Couple_Key | null;
}
```
### Using `DeleteCouple`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, deleteCouple, DeleteCoupleVariables } from '@dataconnect/generated';

// The `DeleteCouple` mutation requires an argument of type `DeleteCoupleVariables`:
const deleteCoupleVars: DeleteCoupleVariables = {
  id: ..., 
};

// Call the `deleteCouple()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await deleteCouple(deleteCoupleVars);
// Variables can be defined inline as well.
const { data } = await deleteCouple({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await deleteCouple(dataConnect, deleteCoupleVars);

console.log(data.couple_delete);

// Or, you can use the `Promise` API.
deleteCouple(deleteCoupleVars).then((response) => {
  const data = response.data;
  console.log(data.couple_delete);
});
```

### Using `DeleteCouple`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, deleteCoupleRef, DeleteCoupleVariables } from '@dataconnect/generated';

// The `DeleteCouple` mutation requires an argument of type `DeleteCoupleVariables`:
const deleteCoupleVars: DeleteCoupleVariables = {
  id: ..., 
};

// Call the `deleteCoupleRef()` function to get a reference to the mutation.
const ref = deleteCoupleRef(deleteCoupleVars);
// Variables can be defined inline as well.
const ref = deleteCoupleRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = deleteCoupleRef(dataConnect, deleteCoupleVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.couple_delete);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.couple_delete);
});
```

## CreateGuest
You can execute the `CreateGuest` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
createGuest(vars: CreateGuestVariables): MutationPromise<CreateGuestData, CreateGuestVariables>;

interface CreateGuestRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateGuestVariables): MutationRef<CreateGuestData, CreateGuestVariables>;
}
export const createGuestRef: CreateGuestRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createGuest(dc: DataConnect, vars: CreateGuestVariables): MutationPromise<CreateGuestData, CreateGuestVariables>;

interface CreateGuestRef {
  ...
  (dc: DataConnect, vars: CreateGuestVariables): MutationRef<CreateGuestData, CreateGuestVariables>;
}
export const createGuestRef: CreateGuestRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createGuestRef:
```typescript
const name = createGuestRef.operationName;
console.log(name);
```

### Variables
The `CreateGuest` mutation requires an argument of type `CreateGuestVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface CreateGuestVariables {
  name: string;
  email: string;
  coupleId: UUIDString;
}
```
### Return Type
Recall that executing the `CreateGuest` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreateGuestData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CreateGuestData {
  guest_insert: Guest_Key;
}
```
### Using `CreateGuest`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createGuest, CreateGuestVariables } from '@dataconnect/generated';

// The `CreateGuest` mutation requires an argument of type `CreateGuestVariables`:
const createGuestVars: CreateGuestVariables = {
  name: ..., 
  email: ..., 
  coupleId: ..., 
};

// Call the `createGuest()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createGuest(createGuestVars);
// Variables can be defined inline as well.
const { data } = await createGuest({ name: ..., email: ..., coupleId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createGuest(dataConnect, createGuestVars);

console.log(data.guest_insert);

// Or, you can use the `Promise` API.
createGuest(createGuestVars).then((response) => {
  const data = response.data;
  console.log(data.guest_insert);
});
```

### Using `CreateGuest`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createGuestRef, CreateGuestVariables } from '@dataconnect/generated';

// The `CreateGuest` mutation requires an argument of type `CreateGuestVariables`:
const createGuestVars: CreateGuestVariables = {
  name: ..., 
  email: ..., 
  coupleId: ..., 
};

// Call the `createGuestRef()` function to get a reference to the mutation.
const ref = createGuestRef(createGuestVars);
// Variables can be defined inline as well.
const ref = createGuestRef({ name: ..., email: ..., coupleId: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createGuestRef(dataConnect, createGuestVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.guest_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.guest_insert);
});
```

## UpdateGuest
You can execute the `UpdateGuest` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
updateGuest(vars: UpdateGuestVariables): MutationPromise<UpdateGuestData, UpdateGuestVariables>;

interface UpdateGuestRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateGuestVariables): MutationRef<UpdateGuestData, UpdateGuestVariables>;
}
export const updateGuestRef: UpdateGuestRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
updateGuest(dc: DataConnect, vars: UpdateGuestVariables): MutationPromise<UpdateGuestData, UpdateGuestVariables>;

interface UpdateGuestRef {
  ...
  (dc: DataConnect, vars: UpdateGuestVariables): MutationRef<UpdateGuestData, UpdateGuestVariables>;
}
export const updateGuestRef: UpdateGuestRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the updateGuestRef:
```typescript
const name = updateGuestRef.operationName;
console.log(name);
```

### Variables
The `UpdateGuest` mutation requires an argument of type `UpdateGuestVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface UpdateGuestVariables {
  id: UUIDString;
  diet?: string | null;
}
```
### Return Type
Recall that executing the `UpdateGuest` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpdateGuestData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpdateGuestData {
  guest_update?: Guest_Key | null;
}
```
### Using `UpdateGuest`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, updateGuest, UpdateGuestVariables } from '@dataconnect/generated';

// The `UpdateGuest` mutation requires an argument of type `UpdateGuestVariables`:
const updateGuestVars: UpdateGuestVariables = {
  id: ..., 
  diet: ..., // optional
};

// Call the `updateGuest()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await updateGuest(updateGuestVars);
// Variables can be defined inline as well.
const { data } = await updateGuest({ id: ..., diet: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await updateGuest(dataConnect, updateGuestVars);

console.log(data.guest_update);

// Or, you can use the `Promise` API.
updateGuest(updateGuestVars).then((response) => {
  const data = response.data;
  console.log(data.guest_update);
});
```

### Using `UpdateGuest`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, updateGuestRef, UpdateGuestVariables } from '@dataconnect/generated';

// The `UpdateGuest` mutation requires an argument of type `UpdateGuestVariables`:
const updateGuestVars: UpdateGuestVariables = {
  id: ..., 
  diet: ..., // optional
};

// Call the `updateGuestRef()` function to get a reference to the mutation.
const ref = updateGuestRef(updateGuestVars);
// Variables can be defined inline as well.
const ref = updateGuestRef({ id: ..., diet: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = updateGuestRef(dataConnect, updateGuestVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.guest_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.guest_update);
});
```

## DeleteGuest
You can execute the `DeleteGuest` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
deleteGuest(vars: DeleteGuestVariables): MutationPromise<DeleteGuestData, DeleteGuestVariables>;

interface DeleteGuestRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteGuestVariables): MutationRef<DeleteGuestData, DeleteGuestVariables>;
}
export const deleteGuestRef: DeleteGuestRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
deleteGuest(dc: DataConnect, vars: DeleteGuestVariables): MutationPromise<DeleteGuestData, DeleteGuestVariables>;

interface DeleteGuestRef {
  ...
  (dc: DataConnect, vars: DeleteGuestVariables): MutationRef<DeleteGuestData, DeleteGuestVariables>;
}
export const deleteGuestRef: DeleteGuestRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the deleteGuestRef:
```typescript
const name = deleteGuestRef.operationName;
console.log(name);
```

### Variables
The `DeleteGuest` mutation requires an argument of type `DeleteGuestVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface DeleteGuestVariables {
  id: UUIDString;
}
```
### Return Type
Recall that executing the `DeleteGuest` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `DeleteGuestData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface DeleteGuestData {
  guest_delete?: Guest_Key | null;
}
```
### Using `DeleteGuest`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, deleteGuest, DeleteGuestVariables } from '@dataconnect/generated';

// The `DeleteGuest` mutation requires an argument of type `DeleteGuestVariables`:
const deleteGuestVars: DeleteGuestVariables = {
  id: ..., 
};

// Call the `deleteGuest()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await deleteGuest(deleteGuestVars);
// Variables can be defined inline as well.
const { data } = await deleteGuest({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await deleteGuest(dataConnect, deleteGuestVars);

console.log(data.guest_delete);

// Or, you can use the `Promise` API.
deleteGuest(deleteGuestVars).then((response) => {
  const data = response.data;
  console.log(data.guest_delete);
});
```

### Using `DeleteGuest`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, deleteGuestRef, DeleteGuestVariables } from '@dataconnect/generated';

// The `DeleteGuest` mutation requires an argument of type `DeleteGuestVariables`:
const deleteGuestVars: DeleteGuestVariables = {
  id: ..., 
};

// Call the `deleteGuestRef()` function to get a reference to the mutation.
const ref = deleteGuestRef(deleteGuestVars);
// Variables can be defined inline as well.
const ref = deleteGuestRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = deleteGuestRef(dataConnect, deleteGuestVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.guest_delete);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.guest_delete);
});
```

## CreateEvent
You can execute the `CreateEvent` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
createEvent(vars: CreateEventVariables): MutationPromise<CreateEventData, CreateEventVariables>;

interface CreateEventRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateEventVariables): MutationRef<CreateEventData, CreateEventVariables>;
}
export const createEventRef: CreateEventRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createEvent(dc: DataConnect, vars: CreateEventVariables): MutationPromise<CreateEventData, CreateEventVariables>;

interface CreateEventRef {
  ...
  (dc: DataConnect, vars: CreateEventVariables): MutationRef<CreateEventData, CreateEventVariables>;
}
export const createEventRef: CreateEventRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createEventRef:
```typescript
const name = createEventRef.operationName;
console.log(name);
```

### Variables
The `CreateEvent` mutation requires an argument of type `CreateEventVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface CreateEventVariables {
  title: string;
  date: TimestampString;
  loc: string;
  coupleId: UUIDString;
}
```
### Return Type
Recall that executing the `CreateEvent` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreateEventData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CreateEventData {
  event_insert: Event_Key;
}
```
### Using `CreateEvent`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createEvent, CreateEventVariables } from '@dataconnect/generated';

// The `CreateEvent` mutation requires an argument of type `CreateEventVariables`:
const createEventVars: CreateEventVariables = {
  title: ..., 
  date: ..., 
  loc: ..., 
  coupleId: ..., 
};

// Call the `createEvent()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createEvent(createEventVars);
// Variables can be defined inline as well.
const { data } = await createEvent({ title: ..., date: ..., loc: ..., coupleId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createEvent(dataConnect, createEventVars);

console.log(data.event_insert);

// Or, you can use the `Promise` API.
createEvent(createEventVars).then((response) => {
  const data = response.data;
  console.log(data.event_insert);
});
```

### Using `CreateEvent`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createEventRef, CreateEventVariables } from '@dataconnect/generated';

// The `CreateEvent` mutation requires an argument of type `CreateEventVariables`:
const createEventVars: CreateEventVariables = {
  title: ..., 
  date: ..., 
  loc: ..., 
  coupleId: ..., 
};

// Call the `createEventRef()` function to get a reference to the mutation.
const ref = createEventRef(createEventVars);
// Variables can be defined inline as well.
const ref = createEventRef({ title: ..., date: ..., loc: ..., coupleId: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createEventRef(dataConnect, createEventVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.event_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.event_insert);
});
```

## UpdateEvent
You can execute the `UpdateEvent` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
updateEvent(vars: UpdateEventVariables): MutationPromise<UpdateEventData, UpdateEventVariables>;

interface UpdateEventRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateEventVariables): MutationRef<UpdateEventData, UpdateEventVariables>;
}
export const updateEventRef: UpdateEventRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
updateEvent(dc: DataConnect, vars: UpdateEventVariables): MutationPromise<UpdateEventData, UpdateEventVariables>;

interface UpdateEventRef {
  ...
  (dc: DataConnect, vars: UpdateEventVariables): MutationRef<UpdateEventData, UpdateEventVariables>;
}
export const updateEventRef: UpdateEventRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the updateEventRef:
```typescript
const name = updateEventRef.operationName;
console.log(name);
```

### Variables
The `UpdateEvent` mutation requires an argument of type `UpdateEventVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface UpdateEventVariables {
  id: UUIDString;
  desc?: string | null;
}
```
### Return Type
Recall that executing the `UpdateEvent` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpdateEventData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpdateEventData {
  event_update?: Event_Key | null;
}
```
### Using `UpdateEvent`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, updateEvent, UpdateEventVariables } from '@dataconnect/generated';

// The `UpdateEvent` mutation requires an argument of type `UpdateEventVariables`:
const updateEventVars: UpdateEventVariables = {
  id: ..., 
  desc: ..., // optional
};

// Call the `updateEvent()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await updateEvent(updateEventVars);
// Variables can be defined inline as well.
const { data } = await updateEvent({ id: ..., desc: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await updateEvent(dataConnect, updateEventVars);

console.log(data.event_update);

// Or, you can use the `Promise` API.
updateEvent(updateEventVars).then((response) => {
  const data = response.data;
  console.log(data.event_update);
});
```

### Using `UpdateEvent`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, updateEventRef, UpdateEventVariables } from '@dataconnect/generated';

// The `UpdateEvent` mutation requires an argument of type `UpdateEventVariables`:
const updateEventVars: UpdateEventVariables = {
  id: ..., 
  desc: ..., // optional
};

// Call the `updateEventRef()` function to get a reference to the mutation.
const ref = updateEventRef(updateEventVars);
// Variables can be defined inline as well.
const ref = updateEventRef({ id: ..., desc: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = updateEventRef(dataConnect, updateEventVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.event_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.event_update);
});
```

## DeleteEvent
You can execute the `DeleteEvent` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
deleteEvent(vars: DeleteEventVariables): MutationPromise<DeleteEventData, DeleteEventVariables>;

interface DeleteEventRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteEventVariables): MutationRef<DeleteEventData, DeleteEventVariables>;
}
export const deleteEventRef: DeleteEventRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
deleteEvent(dc: DataConnect, vars: DeleteEventVariables): MutationPromise<DeleteEventData, DeleteEventVariables>;

interface DeleteEventRef {
  ...
  (dc: DataConnect, vars: DeleteEventVariables): MutationRef<DeleteEventData, DeleteEventVariables>;
}
export const deleteEventRef: DeleteEventRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the deleteEventRef:
```typescript
const name = deleteEventRef.operationName;
console.log(name);
```

### Variables
The `DeleteEvent` mutation requires an argument of type `DeleteEventVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface DeleteEventVariables {
  id: UUIDString;
}
```
### Return Type
Recall that executing the `DeleteEvent` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `DeleteEventData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface DeleteEventData {
  event_delete?: Event_Key | null;
}
```
### Using `DeleteEvent`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, deleteEvent, DeleteEventVariables } from '@dataconnect/generated';

// The `DeleteEvent` mutation requires an argument of type `DeleteEventVariables`:
const deleteEventVars: DeleteEventVariables = {
  id: ..., 
};

// Call the `deleteEvent()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await deleteEvent(deleteEventVars);
// Variables can be defined inline as well.
const { data } = await deleteEvent({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await deleteEvent(dataConnect, deleteEventVars);

console.log(data.event_delete);

// Or, you can use the `Promise` API.
deleteEvent(deleteEventVars).then((response) => {
  const data = response.data;
  console.log(data.event_delete);
});
```

### Using `DeleteEvent`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, deleteEventRef, DeleteEventVariables } from '@dataconnect/generated';

// The `DeleteEvent` mutation requires an argument of type `DeleteEventVariables`:
const deleteEventVars: DeleteEventVariables = {
  id: ..., 
};

// Call the `deleteEventRef()` function to get a reference to the mutation.
const ref = deleteEventRef(deleteEventVars);
// Variables can be defined inline as well.
const ref = deleteEventRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = deleteEventRef(dataConnect, deleteEventVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.event_delete);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.event_delete);
});
```

## CreateRSVP
You can execute the `CreateRSVP` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
createRsvp(vars: CreateRsvpVariables): MutationPromise<CreateRsvpData, CreateRsvpVariables>;

interface CreateRsvpRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateRsvpVariables): MutationRef<CreateRsvpData, CreateRsvpVariables>;
}
export const createRsvpRef: CreateRsvpRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createRsvp(dc: DataConnect, vars: CreateRsvpVariables): MutationPromise<CreateRsvpData, CreateRsvpVariables>;

interface CreateRsvpRef {
  ...
  (dc: DataConnect, vars: CreateRsvpVariables): MutationRef<CreateRsvpData, CreateRsvpVariables>;
}
export const createRsvpRef: CreateRsvpRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createRsvpRef:
```typescript
const name = createRsvpRef.operationName;
console.log(name);
```

### Variables
The `CreateRSVP` mutation requires an argument of type `CreateRsvpVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface CreateRsvpVariables {
  status: string;
  eventId: UUIDString;
  guestId: UUIDString;
}
```
### Return Type
Recall that executing the `CreateRSVP` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreateRsvpData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CreateRsvpData {
  rSVP_insert: RSVP_Key;
}
```
### Using `CreateRSVP`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createRsvp, CreateRsvpVariables } from '@dataconnect/generated';

// The `CreateRSVP` mutation requires an argument of type `CreateRsvpVariables`:
const createRsvpVars: CreateRsvpVariables = {
  status: ..., 
  eventId: ..., 
  guestId: ..., 
};

// Call the `createRsvp()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createRsvp(createRsvpVars);
// Variables can be defined inline as well.
const { data } = await createRsvp({ status: ..., eventId: ..., guestId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createRsvp(dataConnect, createRsvpVars);

console.log(data.rSVP_insert);

// Or, you can use the `Promise` API.
createRsvp(createRsvpVars).then((response) => {
  const data = response.data;
  console.log(data.rSVP_insert);
});
```

### Using `CreateRSVP`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createRsvpRef, CreateRsvpVariables } from '@dataconnect/generated';

// The `CreateRSVP` mutation requires an argument of type `CreateRsvpVariables`:
const createRsvpVars: CreateRsvpVariables = {
  status: ..., 
  eventId: ..., 
  guestId: ..., 
};

// Call the `createRsvpRef()` function to get a reference to the mutation.
const ref = createRsvpRef(createRsvpVars);
// Variables can be defined inline as well.
const ref = createRsvpRef({ status: ..., eventId: ..., guestId: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createRsvpRef(dataConnect, createRsvpVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.rSVP_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.rSVP_insert);
});
```

## UpdateRSVP
You can execute the `UpdateRSVP` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
updateRsvp(vars: UpdateRsvpVariables): MutationPromise<UpdateRsvpData, UpdateRsvpVariables>;

interface UpdateRsvpRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateRsvpVariables): MutationRef<UpdateRsvpData, UpdateRsvpVariables>;
}
export const updateRsvpRef: UpdateRsvpRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
updateRsvp(dc: DataConnect, vars: UpdateRsvpVariables): MutationPromise<UpdateRsvpData, UpdateRsvpVariables>;

interface UpdateRsvpRef {
  ...
  (dc: DataConnect, vars: UpdateRsvpVariables): MutationRef<UpdateRsvpData, UpdateRsvpVariables>;
}
export const updateRsvpRef: UpdateRsvpRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the updateRsvpRef:
```typescript
const name = updateRsvpRef.operationName;
console.log(name);
```

### Variables
The `UpdateRSVP` mutation requires an argument of type `UpdateRsvpVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface UpdateRsvpVariables {
  id: UUIDString;
  note?: string | null;
}
```
### Return Type
Recall that executing the `UpdateRSVP` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpdateRsvpData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpdateRsvpData {
  rSVP_update?: RSVP_Key | null;
}
```
### Using `UpdateRSVP`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, updateRsvp, UpdateRsvpVariables } from '@dataconnect/generated';

// The `UpdateRSVP` mutation requires an argument of type `UpdateRsvpVariables`:
const updateRsvpVars: UpdateRsvpVariables = {
  id: ..., 
  note: ..., // optional
};

// Call the `updateRsvp()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await updateRsvp(updateRsvpVars);
// Variables can be defined inline as well.
const { data } = await updateRsvp({ id: ..., note: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await updateRsvp(dataConnect, updateRsvpVars);

console.log(data.rSVP_update);

// Or, you can use the `Promise` API.
updateRsvp(updateRsvpVars).then((response) => {
  const data = response.data;
  console.log(data.rSVP_update);
});
```

### Using `UpdateRSVP`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, updateRsvpRef, UpdateRsvpVariables } from '@dataconnect/generated';

// The `UpdateRSVP` mutation requires an argument of type `UpdateRsvpVariables`:
const updateRsvpVars: UpdateRsvpVariables = {
  id: ..., 
  note: ..., // optional
};

// Call the `updateRsvpRef()` function to get a reference to the mutation.
const ref = updateRsvpRef(updateRsvpVars);
// Variables can be defined inline as well.
const ref = updateRsvpRef({ id: ..., note: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = updateRsvpRef(dataConnect, updateRsvpVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.rSVP_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.rSVP_update);
});
```

## DeleteRSVP
You can execute the `DeleteRSVP` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
deleteRsvp(vars: DeleteRsvpVariables): MutationPromise<DeleteRsvpData, DeleteRsvpVariables>;

interface DeleteRsvpRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteRsvpVariables): MutationRef<DeleteRsvpData, DeleteRsvpVariables>;
}
export const deleteRsvpRef: DeleteRsvpRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
deleteRsvp(dc: DataConnect, vars: DeleteRsvpVariables): MutationPromise<DeleteRsvpData, DeleteRsvpVariables>;

interface DeleteRsvpRef {
  ...
  (dc: DataConnect, vars: DeleteRsvpVariables): MutationRef<DeleteRsvpData, DeleteRsvpVariables>;
}
export const deleteRsvpRef: DeleteRsvpRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the deleteRsvpRef:
```typescript
const name = deleteRsvpRef.operationName;
console.log(name);
```

### Variables
The `DeleteRSVP` mutation requires an argument of type `DeleteRsvpVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface DeleteRsvpVariables {
  id: UUIDString;
}
```
### Return Type
Recall that executing the `DeleteRSVP` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `DeleteRsvpData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface DeleteRsvpData {
  rSVP_delete?: RSVP_Key | null;
}
```
### Using `DeleteRSVP`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, deleteRsvp, DeleteRsvpVariables } from '@dataconnect/generated';

// The `DeleteRSVP` mutation requires an argument of type `DeleteRsvpVariables`:
const deleteRsvpVars: DeleteRsvpVariables = {
  id: ..., 
};

// Call the `deleteRsvp()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await deleteRsvp(deleteRsvpVars);
// Variables can be defined inline as well.
const { data } = await deleteRsvp({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await deleteRsvp(dataConnect, deleteRsvpVars);

console.log(data.rSVP_delete);

// Or, you can use the `Promise` API.
deleteRsvp(deleteRsvpVars).then((response) => {
  const data = response.data;
  console.log(data.rSVP_delete);
});
```

### Using `DeleteRSVP`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, deleteRsvpRef, DeleteRsvpVariables } from '@dataconnect/generated';

// The `DeleteRSVP` mutation requires an argument of type `DeleteRsvpVariables`:
const deleteRsvpVars: DeleteRsvpVariables = {
  id: ..., 
};

// Call the `deleteRsvpRef()` function to get a reference to the mutation.
const ref = deleteRsvpRef(deleteRsvpVars);
// Variables can be defined inline as well.
const ref = deleteRsvpRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = deleteRsvpRef(dataConnect, deleteRsvpVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.rSVP_delete);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.rSVP_delete);
});
```

## CreateDocument
You can execute the `CreateDocument` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
createDocument(vars: CreateDocumentVariables): MutationPromise<CreateDocumentData, CreateDocumentVariables>;

interface CreateDocumentRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateDocumentVariables): MutationRef<CreateDocumentData, CreateDocumentVariables>;
}
export const createDocumentRef: CreateDocumentRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createDocument(dc: DataConnect, vars: CreateDocumentVariables): MutationPromise<CreateDocumentData, CreateDocumentVariables>;

interface CreateDocumentRef {
  ...
  (dc: DataConnect, vars: CreateDocumentVariables): MutationRef<CreateDocumentData, CreateDocumentVariables>;
}
export const createDocumentRef: CreateDocumentRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createDocumentRef:
```typescript
const name = createDocumentRef.operationName;
console.log(name);
```

### Variables
The `CreateDocument` mutation requires an argument of type `CreateDocumentVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface CreateDocumentVariables {
  title: string;
  url: string;
  coupleId: UUIDString;
}
```
### Return Type
Recall that executing the `CreateDocument` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreateDocumentData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CreateDocumentData {
  document_insert: Document_Key;
}
```
### Using `CreateDocument`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createDocument, CreateDocumentVariables } from '@dataconnect/generated';

// The `CreateDocument` mutation requires an argument of type `CreateDocumentVariables`:
const createDocumentVars: CreateDocumentVariables = {
  title: ..., 
  url: ..., 
  coupleId: ..., 
};

// Call the `createDocument()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createDocument(createDocumentVars);
// Variables can be defined inline as well.
const { data } = await createDocument({ title: ..., url: ..., coupleId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createDocument(dataConnect, createDocumentVars);

console.log(data.document_insert);

// Or, you can use the `Promise` API.
createDocument(createDocumentVars).then((response) => {
  const data = response.data;
  console.log(data.document_insert);
});
```

### Using `CreateDocument`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createDocumentRef, CreateDocumentVariables } from '@dataconnect/generated';

// The `CreateDocument` mutation requires an argument of type `CreateDocumentVariables`:
const createDocumentVars: CreateDocumentVariables = {
  title: ..., 
  url: ..., 
  coupleId: ..., 
};

// Call the `createDocumentRef()` function to get a reference to the mutation.
const ref = createDocumentRef(createDocumentVars);
// Variables can be defined inline as well.
const ref = createDocumentRef({ title: ..., url: ..., coupleId: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createDocumentRef(dataConnect, createDocumentVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.document_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.document_insert);
});
```

## UpdateDocument
You can execute the `UpdateDocument` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
updateDocument(vars: UpdateDocumentVariables): MutationPromise<UpdateDocumentData, UpdateDocumentVariables>;

interface UpdateDocumentRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateDocumentVariables): MutationRef<UpdateDocumentData, UpdateDocumentVariables>;
}
export const updateDocumentRef: UpdateDocumentRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
updateDocument(dc: DataConnect, vars: UpdateDocumentVariables): MutationPromise<UpdateDocumentData, UpdateDocumentVariables>;

interface UpdateDocumentRef {
  ...
  (dc: DataConnect, vars: UpdateDocumentVariables): MutationRef<UpdateDocumentData, UpdateDocumentVariables>;
}
export const updateDocumentRef: UpdateDocumentRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the updateDocumentRef:
```typescript
const name = updateDocumentRef.operationName;
console.log(name);
```

### Variables
The `UpdateDocument` mutation requires an argument of type `UpdateDocumentVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface UpdateDocumentVariables {
  id: UUIDString;
  desc?: string | null;
}
```
### Return Type
Recall that executing the `UpdateDocument` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpdateDocumentData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpdateDocumentData {
  document_update?: Document_Key | null;
}
```
### Using `UpdateDocument`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, updateDocument, UpdateDocumentVariables } from '@dataconnect/generated';

// The `UpdateDocument` mutation requires an argument of type `UpdateDocumentVariables`:
const updateDocumentVars: UpdateDocumentVariables = {
  id: ..., 
  desc: ..., // optional
};

// Call the `updateDocument()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await updateDocument(updateDocumentVars);
// Variables can be defined inline as well.
const { data } = await updateDocument({ id: ..., desc: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await updateDocument(dataConnect, updateDocumentVars);

console.log(data.document_update);

// Or, you can use the `Promise` API.
updateDocument(updateDocumentVars).then((response) => {
  const data = response.data;
  console.log(data.document_update);
});
```

### Using `UpdateDocument`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, updateDocumentRef, UpdateDocumentVariables } from '@dataconnect/generated';

// The `UpdateDocument` mutation requires an argument of type `UpdateDocumentVariables`:
const updateDocumentVars: UpdateDocumentVariables = {
  id: ..., 
  desc: ..., // optional
};

// Call the `updateDocumentRef()` function to get a reference to the mutation.
const ref = updateDocumentRef(updateDocumentVars);
// Variables can be defined inline as well.
const ref = updateDocumentRef({ id: ..., desc: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = updateDocumentRef(dataConnect, updateDocumentVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.document_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.document_update);
});
```

## DeleteDocument
You can execute the `DeleteDocument` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
deleteDocument(vars: DeleteDocumentVariables): MutationPromise<DeleteDocumentData, DeleteDocumentVariables>;

interface DeleteDocumentRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteDocumentVariables): MutationRef<DeleteDocumentData, DeleteDocumentVariables>;
}
export const deleteDocumentRef: DeleteDocumentRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
deleteDocument(dc: DataConnect, vars: DeleteDocumentVariables): MutationPromise<DeleteDocumentData, DeleteDocumentVariables>;

interface DeleteDocumentRef {
  ...
  (dc: DataConnect, vars: DeleteDocumentVariables): MutationRef<DeleteDocumentData, DeleteDocumentVariables>;
}
export const deleteDocumentRef: DeleteDocumentRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the deleteDocumentRef:
```typescript
const name = deleteDocumentRef.operationName;
console.log(name);
```

### Variables
The `DeleteDocument` mutation requires an argument of type `DeleteDocumentVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface DeleteDocumentVariables {
  id: UUIDString;
}
```
### Return Type
Recall that executing the `DeleteDocument` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `DeleteDocumentData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface DeleteDocumentData {
  document_delete?: Document_Key | null;
}
```
### Using `DeleteDocument`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, deleteDocument, DeleteDocumentVariables } from '@dataconnect/generated';

// The `DeleteDocument` mutation requires an argument of type `DeleteDocumentVariables`:
const deleteDocumentVars: DeleteDocumentVariables = {
  id: ..., 
};

// Call the `deleteDocument()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await deleteDocument(deleteDocumentVars);
// Variables can be defined inline as well.
const { data } = await deleteDocument({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await deleteDocument(dataConnect, deleteDocumentVars);

console.log(data.document_delete);

// Or, you can use the `Promise` API.
deleteDocument(deleteDocumentVars).then((response) => {
  const data = response.data;
  console.log(data.document_delete);
});
```

### Using `DeleteDocument`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, deleteDocumentRef, DeleteDocumentVariables } from '@dataconnect/generated';

// The `DeleteDocument` mutation requires an argument of type `DeleteDocumentVariables`:
const deleteDocumentVars: DeleteDocumentVariables = {
  id: ..., 
};

// Call the `deleteDocumentRef()` function to get a reference to the mutation.
const ref = deleteDocumentRef(deleteDocumentVars);
// Variables can be defined inline as well.
const ref = deleteDocumentRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = deleteDocumentRef(dataConnect, deleteDocumentVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.document_delete);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.document_delete);
});
```

