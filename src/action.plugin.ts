import mongoose, { Schema, Document as MongooseDocument } from 'mongoose';
import {intersection, pick, defaults, get, set} from 'lodash';
import ActionModel, {ActionsModelOptions} from './action.model';

export interface DocumentWithActions extends MongooseDocument {
    _original?: any;
    _modifiedBy?: any;
    _modifiedData?: any;
    _modifiedMessage?: any;
    _actions: any[];
    saveActions(): void;
    modifiedBy(user: any): DocumentWithActions;
}

interface ListActionsOptions {
    skip?: number;
    limit?: number;
}

interface MongooseActionsPluginOptions {
    fields?: string[];
    actionModel?: ActionsModelOptions;
}
function mongooseActionsPlugin(schema: Schema, options: MongooseActionsPluginOptions): void {
    const {fields, actionModel} = defaults(options, {
        fields: [],
        actionModel: {}
    });

    const actionModelInstance = ActionModel(actionModel);

    schema.pre('save', async function (this: DocumentWithActions, next: (err?: any) => void) {
        if(!this._actions)
            this._actions = [];

        const originalDoc = await this.model().findOne({_id: this._id}, fields);
        const basicActionData = {
            entity_collection: this.collection.collectionName,
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
        await actionModelInstance.insertMany(this._actions);
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

    schema.methods.listActions = async function(options: ListActionsOptions): Promise<any[]> {
        const {skip, limit} = defaults(options, {
            skip: 0,
            limit: 10,
        });
        const query: any = {
            entity_id: this._id,
            entity_collection: this.collection.collectionName
        };

        return actionModelInstance.find(query).limit(limit).skip(skip);
    };

    //TODO: add post remove hook
}

export default mongooseActionsPlugin;