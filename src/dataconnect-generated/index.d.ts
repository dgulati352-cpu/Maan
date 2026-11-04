import { ConnectorConfig, DataConnect, QueryRef, QueryPromise, ExecuteQueryOptions, MutationRef, MutationPromise, DataConnectSettings } from 'firebase/data-connect';

export const connectorConfig: ConnectorConfig;
export const dataConnectSettings: DataConnectSettings;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;




export interface Couple_Key {
  id: UUIDString;
  __typename?: 'Couple_Key';
}

export interface CreateCoupleData {
  couple_insert: Couple_Key;
}

export interface CreateCoupleVariables {
  partner1: string;
  partner2: string;
  date: DateString;
}

export interface CreateDocumentData {
  document_insert: Document_Key;
}

export interface CreateDocumentVariables {
  title: string;
  url: string;
  coupleId: UUIDString;
}

export interface CreateEventData {
  event_insert: Event_Key;
}

export interface CreateEventVariables {
  title: string;
  date: TimestampString;
  loc: string;
  coupleId: UUIDString;
}

export interface CreateGuestData {
  guest_insert: Guest_Key;
}

export interface CreateGuestVariables {
  name: string;
  email: string;
  coupleId: UUIDString;
}

export interface CreateRsvpData {
  rSVP_insert: RSVP_Key;
}

export interface CreateRsvpVariables {
  status: string;
  eventId: UUIDString;
  guestId: UUIDString;
}

export interface DeleteCoupleData {
  couple_delete?: Couple_Key | null;
}

export interface DeleteCoupleVariables {
  id: UUIDString;
}

export interface DeleteDocumentData {
  document_delete?: Document_Key | null;
}

export interface DeleteDocumentVariables {
  id: UUIDString;
}

export interface DeleteEventData {
  event_delete?: Event_Key | null;
}

export interface DeleteEventVariables {
  id: UUIDString;
}

export interface DeleteGuestData {
  guest_delete?: Guest_Key | null;
}

export interface DeleteGuestVariables {
  id: UUIDString;
}

export interface DeleteRsvpData {
  rSVP_delete?: RSVP_Key | null;
}

export interface DeleteRsvpVariables {
  id: UUIDString;
}

export interface Document_Key {
  id: UUIDString;
  __typename?: 'Document_Key';
}

export interface Event_Key {
  id: UUIDString;
  __typename?: 'Event_Key';
}

export interface GetCoupleData {
  couple?: {
    partnerName1: string;
    partnerName2: string;
    weddingDate: DateString;
  };
}

export interface GetCoupleVariables {
  id: UUIDString;
}

export interface GetDocumentData {
  document?: {
    title: string;
    url: string;
  };
}

export interface GetDocumentVariables {
  id: UUIDString;
}

export interface GetEventData {
  event?: {
    title: string;
    eventDate: TimestampString;
    location: string;
  };
}

export interface GetEventVariables {
  id: UUIDString;
}

export interface GetGuestData {
  guest?: {
    name: string;
    email: string;
  };
}

export interface GetGuestVariables {
  id: UUIDString;
}

export interface GetRsvpData {
  rSVP?: {
    status: string;
    note?: string | null;
  };
}

export interface GetRsvpVariables {
  id: UUIDString;
}

export interface Guest_Key {
  id: UUIDString;
  __typename?: 'Guest_Key';
}

export interface ListCouplesData {
  couples: ({
    partnerName1: string;
    partnerName2: string;
  })[];
}

export interface ListDocumentsData {
  documents: ({
    title: string;
    url: string;
  })[];
}

export interface ListEventsData {
  events: ({
    title: string;
    eventDate: TimestampString;
  })[];
}

export interface ListGuestsData {
  guests: ({
    name: string;
    email: string;
  })[];
}

export interface ListRsvPsData {
  rSVPS: ({
    status: string;
    note?: string | null;
  })[];
}

export interface RSVP_Key {
  id: UUIDString;
  __typename?: 'RSVP_Key';
}

export interface UpdateCoupleData {
  couple_update?: Couple_Key | null;
}

export interface UpdateCoupleVariables {
  id: UUIDString;
  location?: string | null;
}

export interface UpdateDocumentData {
  document_update?: Document_Key | null;
}

export interface UpdateDocumentVariables {
  id: UUIDString;
  desc?: string | null;
}

export interface UpdateEventData {
  event_update?: Event_Key | null;
}

export interface UpdateEventVariables {
  id: UUIDString;
  desc?: string | null;
}

export interface UpdateGuestData {
  guest_update?: Guest_Key | null;
}

export interface UpdateGuestVariables {
  id: UUIDString;
  diet?: string | null;
}

export interface UpdateRsvpData {
  rSVP_update?: RSVP_Key | null;
}

export interface UpdateRsvpVariables {
  id: UUIDString;
  note?: string | null;
}

interface CreateCoupleRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateCoupleVariables): MutationRef<CreateCoupleData, CreateCoupleVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateCoupleVariables): MutationRef<CreateCoupleData, CreateCoupleVariables>;
  operationName: string;
}
export const createCoupleRef: CreateCoupleRef;

export function createCouple(vars: CreateCoupleVariables): MutationPromise<CreateCoupleData, CreateCoupleVariables>;
export function createCouple(dc: DataConnect, vars: CreateCoupleVariables): MutationPromise<CreateCoupleData, CreateCoupleVariables>;

interface UpdateCoupleRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateCoupleVariables): MutationRef<UpdateCoupleData, UpdateCoupleVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpdateCoupleVariables): MutationRef<UpdateCoupleData, UpdateCoupleVariables>;
  operationName: string;
}
export const updateCoupleRef: UpdateCoupleRef;

export function updateCouple(vars: UpdateCoupleVariables): MutationPromise<UpdateCoupleData, UpdateCoupleVariables>;
export function updateCouple(dc: DataConnect, vars: UpdateCoupleVariables): MutationPromise<UpdateCoupleData, UpdateCoupleVariables>;

interface DeleteCoupleRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteCoupleVariables): MutationRef<DeleteCoupleData, DeleteCoupleVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: DeleteCoupleVariables): MutationRef<DeleteCoupleData, DeleteCoupleVariables>;
  operationName: string;
}
export const deleteCoupleRef: DeleteCoupleRef;

export function deleteCouple(vars: DeleteCoupleVariables): MutationPromise<DeleteCoupleData, DeleteCoupleVariables>;
export function deleteCouple(dc: DataConnect, vars: DeleteCoupleVariables): MutationPromise<DeleteCoupleData, DeleteCoupleVariables>;

interface GetCoupleRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetCoupleVariables): QueryRef<GetCoupleData, GetCoupleVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetCoupleVariables): QueryRef<GetCoupleData, GetCoupleVariables>;
  operationName: string;
}
export const getCoupleRef: GetCoupleRef;

export function getCouple(vars: GetCoupleVariables, options?: ExecuteQueryOptions): QueryPromise<GetCoupleData, GetCoupleVariables>;
export function getCouple(dc: DataConnect, vars: GetCoupleVariables, options?: ExecuteQueryOptions): QueryPromise<GetCoupleData, GetCoupleVariables>;

interface ListCouplesRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListCouplesData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListCouplesData, undefined>;
  operationName: string;
}
export const listCouplesRef: ListCouplesRef;

export function listCouples(options?: ExecuteQueryOptions): QueryPromise<ListCouplesData, undefined>;
export function listCouples(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListCouplesData, undefined>;

interface CreateGuestRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateGuestVariables): MutationRef<CreateGuestData, CreateGuestVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateGuestVariables): MutationRef<CreateGuestData, CreateGuestVariables>;
  operationName: string;
}
export const createGuestRef: CreateGuestRef;

export function createGuest(vars: CreateGuestVariables): MutationPromise<CreateGuestData, CreateGuestVariables>;
export function createGuest(dc: DataConnect, vars: CreateGuestVariables): MutationPromise<CreateGuestData, CreateGuestVariables>;

interface UpdateGuestRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateGuestVariables): MutationRef<UpdateGuestData, UpdateGuestVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpdateGuestVariables): MutationRef<UpdateGuestData, UpdateGuestVariables>;
  operationName: string;
}
export const updateGuestRef: UpdateGuestRef;

export function updateGuest(vars: UpdateGuestVariables): MutationPromise<UpdateGuestData, UpdateGuestVariables>;
export function updateGuest(dc: DataConnect, vars: UpdateGuestVariables): MutationPromise<UpdateGuestData, UpdateGuestVariables>;

interface DeleteGuestRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteGuestVariables): MutationRef<DeleteGuestData, DeleteGuestVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: DeleteGuestVariables): MutationRef<DeleteGuestData, DeleteGuestVariables>;
  operationName: string;
}
export const deleteGuestRef: DeleteGuestRef;

export function deleteGuest(vars: DeleteGuestVariables): MutationPromise<DeleteGuestData, DeleteGuestVariables>;
export function deleteGuest(dc: DataConnect, vars: DeleteGuestVariables): MutationPromise<DeleteGuestData, DeleteGuestVariables>;

interface GetGuestRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetGuestVariables): QueryRef<GetGuestData, GetGuestVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetGuestVariables): QueryRef<GetGuestData, GetGuestVariables>;
  operationName: string;
}
export const getGuestRef: GetGuestRef;

export function getGuest(vars: GetGuestVariables, options?: ExecuteQueryOptions): QueryPromise<GetGuestData, GetGuestVariables>;
export function getGuest(dc: DataConnect, vars: GetGuestVariables, options?: ExecuteQueryOptions): QueryPromise<GetGuestData, GetGuestVariables>;

interface ListGuestsRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListGuestsData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListGuestsData, undefined>;
  operationName: string;
}
export const listGuestsRef: ListGuestsRef;

export function listGuests(options?: ExecuteQueryOptions): QueryPromise<ListGuestsData, undefined>;
export function listGuests(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListGuestsData, undefined>;

interface CreateEventRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateEventVariables): MutationRef<CreateEventData, CreateEventVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateEventVariables): MutationRef<CreateEventData, CreateEventVariables>;
  operationName: string;
}
export const createEventRef: CreateEventRef;

export function createEvent(vars: CreateEventVariables): MutationPromise<CreateEventData, CreateEventVariables>;
export function createEvent(dc: DataConnect, vars: CreateEventVariables): MutationPromise<CreateEventData, CreateEventVariables>;

interface UpdateEventRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateEventVariables): MutationRef<UpdateEventData, UpdateEventVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpdateEventVariables): MutationRef<UpdateEventData, UpdateEventVariables>;
  operationName: string;
}
export const updateEventRef: UpdateEventRef;

export function updateEvent(vars: UpdateEventVariables): MutationPromise<UpdateEventData, UpdateEventVariables>;
export function updateEvent(dc: DataConnect, vars: UpdateEventVariables): MutationPromise<UpdateEventData, UpdateEventVariables>;

interface DeleteEventRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteEventVariables): MutationRef<DeleteEventData, DeleteEventVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: DeleteEventVariables): MutationRef<DeleteEventData, DeleteEventVariables>;
  operationName: string;
}
export const deleteEventRef: DeleteEventRef;

export function deleteEvent(vars: DeleteEventVariables): MutationPromise<DeleteEventData, DeleteEventVariables>;
export function deleteEvent(dc: DataConnect, vars: DeleteEventVariables): MutationPromise<DeleteEventData, DeleteEventVariables>;

interface GetEventRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetEventVariables): QueryRef<GetEventData, GetEventVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetEventVariables): QueryRef<GetEventData, GetEventVariables>;
  operationName: string;
}
export const getEventRef: GetEventRef;

export function getEvent(vars: GetEventVariables, options?: ExecuteQueryOptions): QueryPromise<GetEventData, GetEventVariables>;
export function getEvent(dc: DataConnect, vars: GetEventVariables, options?: ExecuteQueryOptions): QueryPromise<GetEventData, GetEventVariables>;

interface ListEventsRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListEventsData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListEventsData, undefined>;
  operationName: string;
}
export const listEventsRef: ListEventsRef;

export function listEvents(options?: ExecuteQueryOptions): QueryPromise<ListEventsData, undefined>;
export function listEvents(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListEventsData, undefined>;

interface CreateRsvpRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateRsvpVariables): MutationRef<CreateRsvpData, CreateRsvpVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateRsvpVariables): MutationRef<CreateRsvpData, CreateRsvpVariables>;
  operationName: string;
}
export const createRsvpRef: CreateRsvpRef;

export function createRsvp(vars: CreateRsvpVariables): MutationPromise<CreateRsvpData, CreateRsvpVariables>;
export function createRsvp(dc: DataConnect, vars: CreateRsvpVariables): MutationPromise<CreateRsvpData, CreateRsvpVariables>;

interface UpdateRsvpRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateRsvpVariables): MutationRef<UpdateRsvpData, UpdateRsvpVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpdateRsvpVariables): MutationRef<UpdateRsvpData, UpdateRsvpVariables>;
  operationName: string;
}
export const updateRsvpRef: UpdateRsvpRef;

export function updateRsvp(vars: UpdateRsvpVariables): MutationPromise<UpdateRsvpData, UpdateRsvpVariables>;
export function updateRsvp(dc: DataConnect, vars: UpdateRsvpVariables): MutationPromise<UpdateRsvpData, UpdateRsvpVariables>;

interface DeleteRsvpRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteRsvpVariables): MutationRef<DeleteRsvpData, DeleteRsvpVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: DeleteRsvpVariables): MutationRef<DeleteRsvpData, DeleteRsvpVariables>;
  operationName: string;
}
export const deleteRsvpRef: DeleteRsvpRef;

export function deleteRsvp(vars: DeleteRsvpVariables): MutationPromise<DeleteRsvpData, DeleteRsvpVariables>;
export function deleteRsvp(dc: DataConnect, vars: DeleteRsvpVariables): MutationPromise<DeleteRsvpData, DeleteRsvpVariables>;

interface GetRsvpRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetRsvpVariables): QueryRef<GetRsvpData, GetRsvpVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetRsvpVariables): QueryRef<GetRsvpData, GetRsvpVariables>;
  operationName: string;
}
export const getRsvpRef: GetRsvpRef;

export function getRsvp(vars: GetRsvpVariables, options?: ExecuteQueryOptions): QueryPromise<GetRsvpData, GetRsvpVariables>;
export function getRsvp(dc: DataConnect, vars: GetRsvpVariables, options?: ExecuteQueryOptions): QueryPromise<GetRsvpData, GetRsvpVariables>;

interface ListRsvPsRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListRsvPsData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListRsvPsData, undefined>;
  operationName: string;
}
export const listRsvPsRef: ListRsvPsRef;

export function listRsvPs(options?: ExecuteQueryOptions): QueryPromise<ListRsvPsData, undefined>;
export function listRsvPs(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListRsvPsData, undefined>;

interface CreateDocumentRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateDocumentVariables): MutationRef<CreateDocumentData, CreateDocumentVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateDocumentVariables): MutationRef<CreateDocumentData, CreateDocumentVariables>;
  operationName: string;
}
export const createDocumentRef: CreateDocumentRef;

export function createDocument(vars: CreateDocumentVariables): MutationPromise<CreateDocumentData, CreateDocumentVariables>;
export function createDocument(dc: DataConnect, vars: CreateDocumentVariables): MutationPromise<CreateDocumentData, CreateDocumentVariables>;

interface UpdateDocumentRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateDocumentVariables): MutationRef<UpdateDocumentData, UpdateDocumentVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpdateDocumentVariables): MutationRef<UpdateDocumentData, UpdateDocumentVariables>;
  operationName: string;
}
export const updateDocumentRef: UpdateDocumentRef;

export function updateDocument(vars: UpdateDocumentVariables): MutationPromise<UpdateDocumentData, UpdateDocumentVariables>;
export function updateDocument(dc: DataConnect, vars: UpdateDocumentVariables): MutationPromise<UpdateDocumentData, UpdateDocumentVariables>;

interface DeleteDocumentRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteDocumentVariables): MutationRef<DeleteDocumentData, DeleteDocumentVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: DeleteDocumentVariables): MutationRef<DeleteDocumentData, DeleteDocumentVariables>;
  operationName: string;
}
export const deleteDocumentRef: DeleteDocumentRef;

export function deleteDocument(vars: DeleteDocumentVariables): MutationPromise<DeleteDocumentData, DeleteDocumentVariables>;
export function deleteDocument(dc: DataConnect, vars: DeleteDocumentVariables): MutationPromise<DeleteDocumentData, DeleteDocumentVariables>;

interface GetDocumentRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetDocumentVariables): QueryRef<GetDocumentData, GetDocumentVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetDocumentVariables): QueryRef<GetDocumentData, GetDocumentVariables>;
  operationName: string;
}
export const getDocumentRef: GetDocumentRef;

export function getDocument(vars: GetDocumentVariables, options?: ExecuteQueryOptions): QueryPromise<GetDocumentData, GetDocumentVariables>;
export function getDocument(dc: DataConnect, vars: GetDocumentVariables, options?: ExecuteQueryOptions): QueryPromise<GetDocumentData, GetDocumentVariables>;

interface ListDocumentsRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListDocumentsData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListDocumentsData, undefined>;
  operationName: string;
}
export const listDocumentsRef: ListDocumentsRef;

export function listDocuments(options?: ExecuteQueryOptions): QueryPromise<ListDocumentsData, undefined>;
export function listDocuments(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListDocumentsData, undefined>;

