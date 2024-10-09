import { Schema, model } from 'mongoose';

const actionSchema = new Schema({
    collection: {type: String, index: true},
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

const ActionModel = model('Action', actionSchema);
export default ActionModel;