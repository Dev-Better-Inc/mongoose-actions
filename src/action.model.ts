import { Schema, model } from 'mongoose';
import {defaults} from "lodash";

export interface ActionsModelOptions {
    modelName? : string,
    collectionName?: string
}

const actionSchema = new Schema({
    entity_collection: {type: String, index: true},
    entity_id: {type: Schema.Types.ObjectId, index: true},
    field: {type: String},
    type: {type: String, require: true},
    old: { type: Schema.Types.Mixed },
    new: { type: Schema.Types.Mixed },
    message: String,
    user: {
        type: Schema.Types.ObjectId,
        default: null
    },
    data: {type: Schema.Types.Map},
}, { timestamps: true });

export default (options: ActionsModelOptions) => {
    const {modelName, collectionName} = defaults(options, {
        modelName: 'MongooseAction',
        collectionName: 'mongoose_actions',
    });

    return  model(modelName, actionSchema, collectionName)
};