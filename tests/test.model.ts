import { Schema, model } from 'mongoose';
import mongooseActionsPlugin from '../src/action.plugin';

const priceSchema = new Schema({
    jit: {
        type: {
            base: Number,
            breakdowns: {type: [{qty: Number, price: Number, _id: false}], default: null}
        },
        default: null,
        _id: false,
    },
    od: {
        type: {
            base: Number,
            breakdowns: {type: [{qty: Number, price: Number, _id: false}], default: null}
        },
        default: null,
        _id: false,
    },
    retail: {
        type: {
            base: Number,
        },
        default: null,
        _id: false,
    }
}, { _id : false });


const testSchema = new Schema({
    name: { type: String },
    description: { type: String },
    untracked: { type: String },
    tags: {
        details: [String]
    },
    pricing: {type: priceSchema, default: null},
    created: {type: Date, default: Date.now},
});

testSchema.plugin(mongooseActionsPlugin, { fields: [
        'name',
        'description',
        'tags',
        'pricing',
        {field: 'created', view: 'date'}
    ] });
const TestModel = model('Test', testSchema);

export default TestModel;