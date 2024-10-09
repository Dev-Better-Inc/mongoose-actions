import { connect, disconnect, clearDatabase } from './database';
import TestModel from './test.model';
import ActionModel from "../src/action.model";
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
      expect(actions[1].new).toBe('Updated description');
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
      expect(actions[2].new).toBe('Updated description with modifiedBy');
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

      expect(actions.length).toBeGreaterThan(0);
      expect(actions[0].entity_collection).toBe(Test2Model.collection.collectionName);
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