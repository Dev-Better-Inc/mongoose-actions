import mongoose, { Schema, Document as MongooseDocument } from 'mongoose';
import {intersection, keyBy, defaults, get, map, isObject} from 'lodash';
import ActionModel, {ActionsModelOptions} from './action.model';

export interface DocumentWithActions extends MongooseDocument {
    _original?: any;
    _modifiedBy?: any;
    _modifiedData?: any;
    _modifiedMessage?: any;
    _actions: any[];
    saveActions(): Promise<any>;
    modifiedBy(user: any): DocumentWithActions;
    listActions(data?: ListActionsOptions): Promise<ListActionsResponse>;
}

interface ListActionsOptions {
    offset?: number;
    limit?: number;
}

interface ListActionsResponse {
    actions: any[];
    limit: number;
    offset: number;
    total: number;
}

interface MongooseActionsPluginOptions {
    fields?: any[];
    actionModel?: ActionsModelOptions;
}

interface ActionValues {
    oldValue?: any,
    newValue?: any
}

function mongooseActionsPlugin(schema: Schema, options: MongooseActionsPluginOptions): void {
    const {fields, actionModel} = defaults(options, {
        fields: [],
        actionModel: {}
    });

    const fieldsFormatted = keyBy(map(fields, item => !isObject(item) ? {field: item} : item), 'field');
    const fieldsToSave = map(fieldsFormatted, 'field');
    const actionModelInstance = ActionModel(actionModel);

    schema.pre('save', async function (this: DocumentWithActions, next: (err?: any) => void) {
        if(!this._actions)
            this._actions = [];

        let originalDoc;
        if(mongoose.version >= "7.6.2")
            originalDoc = await this.model().findById(this._id, fieldsToSave);
        else
            originalDoc = await (this.constructor as mongoose.Model<DocumentWithActions>).findById(this._id, fieldsToSave);

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

        const logFields = intersection(this.modifiedPaths(), fieldsToSave);
        if(!logFields.length)
            return next();

        function getFieldTypeBySchemaInstance(instance: string): string | null {
            if(['String', 'Number', 'Date', 'Boolean'].includes(instance))
                return instance.toLowerCase()

            return null;
        }

        async function defaultValues(oldValue: any,  newValue: any): Promise<ActionValues>{

            return {oldValue, newValue};
        }

        //TODO: Move all fields to one action. (maybe not)
        for (const key of logFields) {
            let fieldType = get(fieldsFormatted, `${key}.fieldType`, null);
            if(!fieldType)
                fieldType = getFieldTypeBySchemaInstance(get(schema.path(key), 'instance')) ?? key;

            let processValues = get(fieldsFormatted, `${key}.values`, defaultValues) as typeof defaultValues;

            const values = await processValues(get(originalDoc, key, null), get(this, key, null)) as ActionValues;

            const action = {
                ...basicActionData,
                field: key,
                type: 'update',
                ...values,
                fieldType
            };
            this._actions.push(action);
        }

        next();
    });



    schema.methods.saveActions = async function(): Promise<any> {
        // TODO: add another drivers (e.g other api)
        return actionModelInstance.insertMany(this._actions);
    };

    // TODO: use other _modified fields
    schema.methods.modifiedBy = function (user: any) {
      this._modifiedBy = user;

      return this;
    };

    schema.post('save', function (doc: DocumentWithActions, next: (err?: any) => void) {
        doc.saveActions()
            .finally(next);
    });

    schema.methods.listActions = async function(options: ListActionsOptions): Promise<ListActionsResponse> {
        const {offset, limit} = defaults(options, {
            offset: 0,
            limit: 10,
        });
        const queryData: any = {
            entity_id: this._id,
            entity_collection: this.collection.collectionName
        };
        const query = actionModelInstance.find(queryData);

        const countQuery = query.model.find().merge(query)
        const total = await countQuery.countDocuments();
        const actions = await query
            .limit(limit)
            .skip(offset)
            .sort({created: -1})
            .exec();

        return {actions, limit, offset, total};
    };

    //TODO: add post remove hook
}

export default mongooseActionsPlugin;