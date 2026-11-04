# Basic Usage

Always prioritize using a supported framework over using the generated SDK
directly. Supported frameworks simplify the developer experience and help ensure
best practices are followed.





## Advanced Usage
If a user is not using a supported framework, they can use the generated SDK directly.

Here's an example of how to use it with the first 5 operations:

```js
import { createCouple, updateCouple, deleteCouple, getCouple, listCouples, createGuest, updateGuest, deleteGuest, getGuest, listGuests } from '@dataconnect/generated';


// Operation CreateCouple:  For variables, look at type CreateCoupleVars in ../index.d.ts
const { data } = await CreateCouple(dataConnect, createCoupleVars);

// Operation UpdateCouple:  For variables, look at type UpdateCoupleVars in ../index.d.ts
const { data } = await UpdateCouple(dataConnect, updateCoupleVars);

// Operation DeleteCouple:  For variables, look at type DeleteCoupleVars in ../index.d.ts
const { data } = await DeleteCouple(dataConnect, deleteCoupleVars);

// Operation GetCouple:  For variables, look at type GetCoupleVars in ../index.d.ts
const { data } = await GetCouple(dataConnect, getCoupleVars);

// Operation ListCouples: 
const { data } = await ListCouples(dataConnect);

// Operation CreateGuest:  For variables, look at type CreateGuestVars in ../index.d.ts
const { data } = await CreateGuest(dataConnect, createGuestVars);

// Operation UpdateGuest:  For variables, look at type UpdateGuestVars in ../index.d.ts
const { data } = await UpdateGuest(dataConnect, updateGuestVars);

// Operation DeleteGuest:  For variables, look at type DeleteGuestVars in ../index.d.ts
const { data } = await DeleteGuest(dataConnect, deleteGuestVars);

// Operation GetGuest:  For variables, look at type GetGuestVars in ../index.d.ts
const { data } = await GetGuest(dataConnect, getGuestVars);

// Operation ListGuests: 
const { data } = await ListGuests(dataConnect);


```