import mongoose, {Schema, model, Types} from 'mongoose';
import mongooseActionsPlugin from '../src/action.plugin';
import {keyBy, map, pick} from 'lodash';

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
    subdocuments: [Schema.Types.ObjectId],
    pricing: {type: priceSchema, default: null},
    created: {type: Date, default: Date.now},
});

testSchema.plugin(mongooseActionsPlugin, { fields: [
        'name',
        'description',
        'tags',
        'pricing',
        {field: 'created', fieldType: 'date'},
        {field: 'subdocuments', values: async (oldValue: any, newValue: any) => {
            const values = await mongoose.model('Test2').find({_id: {$in: [...oldValue, ...newValue]}});
            const valuesMap = keyBy(values, '_id');

            oldValue = map(oldValue, item => pick(valuesMap[item], ['_id', 'name']));
            newValue = map(newValue, item => pick(valuesMap[item], ['_id', 'name']));

            return {oldValue, newValue};
        }}
        ] });
const TestModel = model('Test', testSchema);

export default TestModel;