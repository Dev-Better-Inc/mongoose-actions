import { connect, disconnect, clearDatabase } from './database';
import TestModel from './test.model';
import mongoose from "mongoose";
import Test2Model from "./test2.model";

describe('TestModel', () => {
  beforeAll(async () => {
    await connect();
  });

  describe('TestModel CRUD operations', () => {
    it('should create a new document', async () => {
      const testDoc = new TestModel({ name: 'Test' });
      const savedDoc = await testDoc.save();
      expect(savedDoc.name).toBe('Test');

      // @ts-ignore
      const actions = await testDoc.listActions();
      expect(actions.length).toBeGreaterThan(0);
      expect(actions[0].type).toBe('creation');
    });

    it('should find a document by name', async () => {
      const foundDoc = await TestModel.findOne({ name: 'Test' });
      expect(foundDoc).not.toBeNull();
      expect(foundDoc?.name).toBe('Test');
    });

    it('should update a document description', async () => {
      const testDoc = await TestModel.findOne({ name: 'Test' });
      expect(testDoc).not.toBeNull();
      if (!testDoc) return;

      testDoc.description = 'Updated description';
      const updatedDoc = await testDoc.save();
      expect(updatedDoc.description).toBe('Updated description');

      // @ts-ignore
      const actions = await testDoc.listActions();

      expect(actions.length).toBeGreaterThan(0);

      expect(actions[1].type).toBe('update');
      expect(actions[1].field).toBe('description');
      expect(actions[1].newValue).toBe('Updated description');
    });

    it('should update a document untracked field', async () => {
      const testDoc = await TestModel.findOne({ name: 'Test' });
      expect(testDoc).not.toBeNull();
      if (!testDoc) return;

      testDoc.untracked = 'Updated untracked field';
      const updatedDoc = await testDoc.save();
      expect(updatedDoc.untracked).toBe('Updated untracked field');

      // @ts-ignore
      const actions = await testDoc.listActions();
      expect(actions.length).toBeGreaterThan(0);
      expect(actions.some((action: any) => action.field === 'untracked')).toBe(false);
    });

    it('should update a document description and set modifiedBy field', async () => {
      const testDoc = await TestModel.findOne({ name: 'Test' });
      expect(testDoc).not.toBeNull();
      if (!testDoc) return;

      testDoc.description = 'Updated description with modifiedBy';

      const user = new mongoose.Types.ObjectId();
      //@ts-ignore
      await testDoc.modifiedBy(user).save();

      // @ts-ignore
      const actions = await testDoc.listActions();

      expect(actions.length).toBeGreaterThan(0);
      expect(actions[2].type).toBe('update');
      expect(actions[2].field).toBe('description');
      expect(actions[2].newValue).toBe('Updated description with modifiedBy');
      expect(actions[2].user.toString()).toBe(user.toString());
    });

    it('should test the listActions method', async () => {
      const testDoc = await TestModel.findOne({ name: 'Test' });
      expect(testDoc).not.toBeNull();
      if (!testDoc) return;

      // @ts-ignore
      const actions = await testDoc.listActions();
      expect(actions.length).toBeGreaterThan(0);
      expect(actions[0].type).toBeDefined();
      expect(actions[0].entity_collection).toBe(TestModel.collection.collectionName);
      expect(actions.every((action: any) => action.entity_collection === TestModel.collection.collectionName)).toBe(true);
    });

    it('should create a new document by Test2Model', async () => {
      const testDoc = new Test2Model({ name: 'Test' });
      const savedDoc = await testDoc.save();
      expect(savedDoc.name).toBe('Test');

      // @ts-ignore
      const actions = await testDoc.listActions();

      expect(actions.length).toBe(1);
      expect(actions[0].entity_collection).toBe(Test2Model.collection.collectionName);
    });

    it('should update a tags field', async () => {
      const testDoc = await TestModel.findOne({ name: 'Test' });
      expect(testDoc).not.toBeNull();
      if (!testDoc) return;

      if(!testDoc.tags) testDoc.tags = {
        details: []
      };
      testDoc.tags.details = ['tag1', 'tag2'];
      const updatedDoc = await testDoc.save();
      expect(updatedDoc.tags?.details).toEqual(['tag1', 'tag2']);

      // @ts-ignore
      const actions = await testDoc.listActions();
      expect(actions.length).toBeGreaterThan(0);
      // console.log(actions)
      expect(actions.some((action: any) => action.field === 'tags')).toBe(true);
    });

    it('should update subdocuments', async () => {
      const testDoc = await TestModel.findOne({ name: 'Test' });
      expect(testDoc).not.toBeNull();
      if (!testDoc) return;

      const pricingData = {"od":{"base":90,"breakdowns":[{"qty":50,"price":100},{"qty":100,"price":120}]},"jit":{"base":10,"breakdowns":[{"qty":15000,"price":9},{"qty":20000,"price":8}]},"retail":{"base":299}};

      testDoc.set('pricing', pricingData);
      await testDoc.save();

      // @ts-ignore
      const actions = await testDoc.listActions();
      expect(actions.length).toBeGreaterThan(0);

      expect(actions.some((action: any) => action.field === 'pricing')).toBe(true);

      const action = actions.find((action: any) => action.field === 'pricing');
      expect(action.newValue).toEqual(pricingData);
    });

    it('should update the created field', async () => {
      const testDoc = await TestModel.findOne({ name: 'Test' });
      expect(testDoc).not.toBeNull();
      if (!testDoc) return;

      testDoc.created = new Date();
      await testDoc.save();

      // @ts-ignore
      const actions = await testDoc.listActions();
      expect(actions.length).toBeGreaterThan(0);
      expect(actions.some((action: any) => action.field === 'created')).toBe(true);
    });

    it('should add field and use custom values resolver', async () => {
      const testDoc = await TestModel.findOne({ name: 'Test' });
      expect(testDoc).not.toBeNull();

      if (!testDoc) return;
      const test2Doc = new Test2Model({ name: 'Test2' });
      await test2Doc.save();

      testDoc.subdocuments.push(test2Doc._id);
      await testDoc.save();

      // @ts-ignore
      const actions = await testDoc.listActions();
      expect(actions.length).toBeGreaterThan(0);

      expect(actions.some((action: any) => action.field === 'subdocuments')).toBe(true);

      const action = actions.find((action: any) => action.field === 'subdocuments');

      expect(action.oldValue).toEqual([]);
      expect(action.newValue[0]?._id).toEqual(test2Doc._id);
      expect(action.newValue[0]?.name).toEqual(test2Doc.name);
    });

    it('should update field and use custom values resolver', async () => {
      const testDoc = await TestModel.findOne({ name: 'Test' });
      expect(testDoc).not.toBeNull();

      if (!testDoc) return;
      const test2Doc = new Test2Model({ name: 'Test2_2' });
      await test2Doc.save();

      testDoc.subdocuments.push(test2Doc._id);
      await testDoc.save();

      // @ts-ignore
      const actions = await testDoc.listActions();
      expect(actions.length).toBeGreaterThan(0);

      expect(actions.some((action: any) => action.field === 'subdocuments')).toBe(true);

      const action = actions.findLast((action: any) => action.field === 'subdocuments');

      expect(action.oldValue).not.toEqual([]);
      expect(action.newValue[1]?._id).toEqual(test2Doc._id);
      expect(action.newValue[1]?.name).toEqual(test2Doc.name);
    });


    it('should delete a document', async () => {
      const result = await TestModel.deleteOne({ name: 'Test' });
      expect(result.deletedCount).toBe(1);
    });

    afterAll(async () => {
      await clearDatabase();
    });
  });

  afterAll(async () => {
    await disconnect();
  });
});