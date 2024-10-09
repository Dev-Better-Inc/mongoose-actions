import { Schema, model } from 'mongoose';
import mongooseActionsPlugin from '../src/action.plugin';

const testSchema = new Schema({
    name: { type: String },
    description: { type: String },
    untracked: { type: String },
});

testSchema.plugin(mongooseActionsPlugin, { fields: ['name', 'description'] });
const TestModel = model('Test', testSchema);

export default TestModel;