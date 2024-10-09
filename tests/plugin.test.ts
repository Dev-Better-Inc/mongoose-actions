import { connect, disconnect, clearDatabase } from './database';
import TestModel from './test.model';
import ActionModel from "../src/action.model";
import mongoose from "mongoose";

describe('TestModel', () => {
  beforeAll(async () => {
    await connect();
  });

  describe('TestModel CRUD operations', () => {
    it('should create a new document', async () => {
      const testDoc = new TestModel({ name: 'Test' });
      const savedDoc = await testDoc.save();
      expect(savedDoc.name).toBe('Test');

      const actions = await ActionModel.find({ entity_id: testDoc._id });

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

      const actions = await ActionModel.find({ entity_id: testDoc._id });

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

      const actions = await ActionModel.find({ entity_id: testDoc._id });
      expect(actions.length).toBeGreaterThan(0);
      expect(actions.some(action => action.field === 'untracked')).toBe(false);
    });

    it('should update a document description and set modifiedBy field', async () => {
      const testDoc = await TestModel.findOne({ name: 'Test' });
      expect(testDoc).not.toBeNull();
      if (!testDoc) return;

      testDoc.description = 'Updated description with modifiedBy';

      const user = new mongoose.Types.ObjectId();
      //@ts-ignore
      await testDoc.modifiedBy(user).save();

      const actions = await ActionModel.find({ entity_id: testDoc._id });

      expect(actions.length).toBeGreaterThan(0);
      expect(actions[2].type).toBe('update');
      expect(actions[2].field).toBe('description');
      expect(actions[2].new).toBe('Updated description with modifiedBy');
      expect(actions[2].user.toString()).toBe(user.toString());
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