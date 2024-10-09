# mongoose-actions

`mongoose-actions` is a Mongoose plugin that tracks changes to documents and logs actions such as creation, updates, and deletions.

## Installation

```bash
npm install mongoose-actions
```

## Usage

### Plugin Setup

First, apply the plugin to your Mongoose schema:

```typescript
import mongoose from 'mongoose';
import mongooseActionsPlugin from 'mongoose-actions';

const testSchema = new mongoose.Schema({
  name: String,
  description: String,
  untracked: String,
});

testSchema.plugin(mongooseActionsPlugin, { fields: ['name', 'description'] });

const TestModel = mongoose.model('Test', testSchema);
```

### Example

Here is an example of how to use the plugin:

```typescript
import mongoose from 'mongoose';
import TestModel from './path-to-your-model';

async function run() {
  const testDoc = new TestModel({ name: 'Test', description: 'Initial description' });
  await testDoc.save();

  testDoc.description = 'Updated description';
  const user = new mongoose.Types.ObjectId();
  await testDoc.modifiedBy(user).save();
}

run();
```

## Running Tests

To run tests, use the following command:

```bash
npm test
```

## License

This project is licensed under the ISC License.