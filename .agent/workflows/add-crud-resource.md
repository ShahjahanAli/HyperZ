---
description: How to add a complete CRUD resource (controller + model + migration + routes)
---

# Add a CRUD Resource

## Steps

// turbo-all

1. Create the controller:
```bash
npx tsx bin/hyperz.ts make:controller <Name>Controller
```

2. Create the model with migration:
```bash
npx tsx bin/hyperz.ts make:model <Name> -m
```

3. Edit the migration file in `database/migrations/` to define your table columns.

4. Create a route file:
```bash
npx tsx bin/hyperz.ts make:route <name>
```

5. Edit the route file in `app/routes/<name>.ts` to register the resource route:
```typescript
import { HyperZRouter } from '../../src/http/Router.js';
import { <Name>Controller } from '../controllers/<Name>Controller.js';

const router = new HyperZRouter();
const controller = new <Name>Controller();

router.resource('/<plural-name>', controller);

export default router;
```

6. Run the migration:
```bash
npx tsx bin/hyperz.ts migrate
```

7. Optionally create a seeder:
```bash
npx tsx bin/hyperz.ts make:seeder <Name>Seeder
```

8. Test your API at `http://localhost:7700/api/<plural-name>` or use the API Playground.
