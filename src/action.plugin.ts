import mongoose, { Schema, Document as MongooseDocument } from 'mongoose';
import {intersection, pick, defaults, get} from 'lodash';
import ActionModel from './action.model';
export interface DocumentWithActions extends MongooseDocument {
    _original?: any;
    _modifiedBy?: any;
    _modifiedData?: any;
    _modifiedMessage?: any;
    _actions: any[];
    saveActions(): void;
    modifiedBy(user: any): DocumentWithActions;
}
function mongooseActionsPlugin(schema: Schema, options: {fields: string[]}) {
    const {fields} = defaults(options, {
        fields: []
    });

    schema.pre('save', async function (this: DocumentWithActions, next: (err?: any) => void) {
        if(!this._actions)
            this._actions = [];

        const originalDoc = await this.model().findOne({_id: this._id}, fields);
        const basicActionData = {
            entity_id: this._id,
            user: this._modifiedBy,
            data: this._modifiedData,
            message: this._modifiedMessage
        };

        if(!originalDoc){
            const action = {
                ...basicActionData,
                type: 'creation',
            };
            this._actions.push(action);
            return next();
        }

        const logFields = intersection(this.modifiedPaths(), fields);
        if(!logFields.length)
            return next();

        //TODO: Move all fields to one action. (maybe not)
        for (const key of logFields) {
            const action = {
                ...basicActionData,
                field: key,
                type: 'update',
                new: get(this, key, null),
                old: get(originalDoc, key, null),
            };
            this._actions.push(action);
        }

        next();
    });

    schema.methods.saveActions = async function(): Promise<void> {
        // TODO: add another drivers (e.g other api)
        await ActionModel.insertMany(this._actions);
    };

    // TODO: use other _modified fields
    schema.methods.modifiedBy = function (user: any) {
      this._modifiedBy = user;

      return this;
    };

    schema.post('save', function (doc: DocumentWithActions, next: (err?: any) => void) {
        doc.saveActions();
        next();
    });

    //TODO: add post remove hook
    //TODO: add the list actions method
}

export default mongooseActionsPlugin;