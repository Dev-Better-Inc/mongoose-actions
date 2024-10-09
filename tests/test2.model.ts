import { Schema, model } from 'mongoose';
import mongooseActionsPlugin from '../src/action.plugin';

const test2Schema = new Schema({
    name: { type: String },
    description: { type: String },
    untracked: { type: String },
});

test2Schema.plugin(mongooseActionsPlugin, { fields: ['name', 'description'] });
const Test2Model = model('Test2', test2Schema);

export default Test2Model;